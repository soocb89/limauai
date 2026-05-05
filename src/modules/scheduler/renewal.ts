import { db } from '../../db/index.js'
import { sendText } from '../wa-connector/sender.js'

export type RenewalStep = 't30' | 't14' | 't3' | 't1'

interface RenewalJobData {
  customerId: string
  step: RenewalStep
}

async function getQuotationUrl(customerId: string): Promise<string | null> {
  const { rows } = await db.query(
    `SELECT q.quotation_url
     FROM quotations q
     WHERE q.customer_id = $1 AND q.status != 'expired'
     ORDER BY q.created_at DESC LIMIT 1`,
    [customerId]
  )
  return rows[0]?.quotation_url ?? null
}

async function getCustomer(customerId: string) {
  const { rows } = await db.query(
    `SELECT id, phone, name, language, insurer, consent, renewal_date
     FROM customers WHERE id = $1`,
    [customerId]
  )
  return rows[0] ?? null
}

async function getBotConfig(key: string): Promise<string | null> {
  const { rows } = await db.query('SELECT value FROM bot_config WHERE key = $1', [key])
  return rows[0]?.value ?? null
}

function getMessage(
  step: RenewalStep,
  lang: string,
  insurer: string,
  quotationUrl: string | null,
  consent: boolean
): string {
  if (step === 't30') {
    const msgs: Record<string, string> = {
      bm: `Insurans ${insurer} anda akan tamat dalam 30 hari. Boleh kami bantu proses pembaharuan? (Ya/Tidak)`,
      zh: `您的${insurer}保险将在30天后到期。我们可以帮您办理续保吗？（是/否）`,
      ta: `உங்கள் ${insurer} காப்பீடு 30 நாட்களில் காலாவதியாகும். புதுப்பிக்க உதவட்டுமா? (ஆம்/இல்லை)`,
      en: `Your ${insurer} insurance expires in 30 days. Can we help with renewal? (Yes/No)`,
    }
    return msgs[lang] ?? msgs.bm
  }

  if (step === 't14') {
    if (consent && quotationUrl) {
      const msgs: Record<string, string> = {
        bm: `Berikut adalah pautan sebut harga pembaharuan insurans anda: ${quotationUrl}`,
        zh: `这是您的保险续保报价链接：${quotationUrl}`,
        ta: `இங்கே உங்கள் காப்பீடு புதுப்பிப்பு மேற்கோள் இணைப்பு: ${quotationUrl}`,
        en: `Here is your insurance renewal quote link: ${quotationUrl}`,
      }
      return msgs[lang] ?? msgs.bm
    }
    const msgs: Record<string, string> = {
      bm: `Peringatan: insurans ${insurer} anda akan tamat dalam 14 hari. Boleh kami bantu? (Ya/Tidak)`,
      zh: `提醒：您的${insurer}保险将在14天后到期。我们可以帮忙吗？（是/否）`,
      ta: `நினைவூட்டல்: ${insurer} காப்பீடு 14 நாட்களில் காலாவதியாகும். உதவட்டுமா? (ஆம்/இல்லை)`,
      en: `Reminder: Your ${insurer} insurance expires in 14 days. Can we help? (Yes/No)`,
    }
    return msgs[lang] ?? msgs.bm
  }

  if (step === 't3') {
    if (consent && quotationUrl) {
      const msgs: Record<string, string> = {
        bm: `Hanya 3 hari lagi! Pautan sebut harga pembaharuan: ${quotationUrl}`,
        zh: `只剩3天！续保报价链接：${quotationUrl}`,
        ta: `3 நாட்கள் மட்டுமே! புதுப்பிப்பு மேற்கோள் இணைப்பு: ${quotationUrl}`,
        en: `Only 3 days left! Renewal quote link: ${quotationUrl}`,
      }
      return msgs[lang] ?? msgs.bm
    }
    const msgs: Record<string, string> = {
      bm: `Insurans ${insurer} anda akan tamat dalam 3 hari. Sila hubungi kami segera.`,
      zh: `您的${insurer}保险将在3天内到期，请立即联系我们。`,
      ta: `உங்கள் ${insurer} காப்பீடு 3 நாட்களில் காலாவதியாகும். உடனே தொடர்புகொள்ளுங்கள்.`,
      en: `Your ${insurer} insurance expires in 3 days. Please contact us immediately.`,
    }
    return msgs[lang] ?? msgs.bm
  }

  const msgs: Record<string, string> = {
    bm: `Polisi insurans anda mungkin telah tamat tempoh. Sila hubungi kami sekarang.`,
    zh: `您的保险可能已过期，请立即联系我们。`,
    ta: `உங்கள் காப்பீடு காலாவதியாகியிருக்கலாம். இப்போதே தொடர்புகொள்ளுங்கள்.`,
    en: `Your insurance policy may have lapsed. Please contact us now.`,
  }
  return msgs[lang] ?? msgs.bm
}

export async function processRenewalStep(data: RenewalJobData): Promise<void> {
  const customer = await getCustomer(data.customerId)
  if (!customer) return

  const lang = customer.language ?? (await getBotConfig('language_fallback')) ?? 'bm'
  const quotationUrl = await getQuotationUrl(data.customerId)
  const msg = getMessage(data.step, lang, customer.insurer ?? 'insurans', quotationUrl, customer.consent)

  await sendText(customer.phone, msg)

  await db.query(
    `UPDATE follow_up_jobs SET status = 'sent', sent_at = NOW()
     WHERE customer_id = $1 AND step = $2 AND status = 'pending'`,
    [data.customerId, data.step]
  )
}
