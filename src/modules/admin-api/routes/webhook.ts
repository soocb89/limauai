import { Router } from 'express'
import { db } from '../../../db/index.js'
import { sendText } from '../../wa-connector/sender.js'

export const webhookRouter = Router()

type MsgFn = (url: string, insurer: string) => string

const QUOTATION_MSG: Record<string, MsgFn> = {
  bm: (url, insurer) => `Sebut harga pembaharuan insurans ${insurer} anda sedia. Klik untuk dapatkan sebut harga: ${url}`,
  zh: (url, insurer) => `您的${insurer}续保报价已准备好。点击获取报价：${url}`,
  ta: (url, insurer) => `${insurer} புதுப்பிப்பு மேற்கோள் தயாராக உள்ளது: ${url}`,
  en: (url, insurer) => `Your ${insurer} renewal quote is ready. Get your quote here: ${url}`,
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

webhookRouter.post('/w/:token', async (req, res) => {
  const { rows: wh } = await db.query(
    'SELECT id, message_template FROM webhooks WHERE token = $1',
    [req.params.token]
  )
  if (!wh[0]) return res.status(401).json({ error: 'Invalid token' })

  const body: Record<string, string> = req.body
  const phone = body.phone
  if (!phone) return res.status(400).json({ error: 'phone required' })

  const normalizedPhone = phone.replace(/\D/g, '')
  const { name, car_plate, insurer, amount, quotation_url } = body

  const { rows: upserted } = await db.query(
    `INSERT INTO customers (phone, name, car_plate, insurer, source)
     VALUES ($1,$2,$3,$4,'bot_captured')
     ON CONFLICT (phone) DO UPDATE SET
       name = COALESCE(EXCLUDED.name, customers.name),
       car_plate = COALESCE(EXCLUDED.car_plate, customers.car_plate),
       insurer = COALESCE(EXCLUDED.insurer, customers.insurer),
       updated_at = NOW()
     RETURNING id, language, name`,
    [normalizedPhone, name ?? null, car_plate ?? null, insurer ?? null]
  )
  const customer = upserted[0]

  if (quotation_url) {
    await db.query(
      `INSERT INTO quotations (customer_id, quotation_url, insurer, amount, status)
       VALUES ($1,$2,$3,$4,'sent')`,
      [customer.id, quotation_url, insurer ?? null, amount ?? null]
    )
  }

  await db.query('UPDATE webhooks SET last_used_at = NOW() WHERE id = $1', [wh[0].id])

  let message: string
  if (wh[0].message_template) {
    // Merge all body fields + resolved customer fields for template substitution
    const vars: Record<string, string> = {
      ...body,
      name: customer.name ?? name ?? '',
      phone: normalizedPhone,
    }
    message = renderTemplate(wh[0].message_template, vars)
  } else {
    // Default fallback message
    const lang = customer.language ?? 'bm'
    const displayName = customer.name ? `, ${customer.name}` : ''
    const insurerStr = insurer ?? 'insurans'
    const amountStr = amount ? ` (RM${amount})` : ''
    const defaults: Record<string, string> = {
      bm: quotation_url
        ? `Hai${displayName}! Sebut harga pembaharuan ${insurerStr}${amountStr} anda sedia: ${quotation_url}`
        : `Hai${displayName}! Maklumat pembaharuan ${insurerStr}${amountStr} anda telah dikemas kini.`,
      zh: quotation_url
        ? `您好${displayName}！您的${insurerStr}续保报价${amountStr}已准备好：${quotation_url}`
        : `您好${displayName}！您的${insurerStr}续保信息已更新。`,
      en: quotation_url
        ? `Hi${displayName}! Your ${insurerStr} renewal quote${amountStr} is ready: ${quotation_url}`
        : `Hi${displayName}! Your ${insurerStr} renewal info has been updated.`,
    }
    message = defaults[lang] ?? defaults.bm
  }

  await sendText(normalizedPhone, message)
  res.json({ sent: true, customer_id: customer.id })
})

webhookRouter.post('/quotation', async (req, res) => {
  const { phone, quotation_url, quotation_ref, insurer, amount } = req.body

  if (!phone || !quotation_url) {
    return res.status(400).json({ error: 'phone and quotation_url required' })
  }

  const normalizedPhone = phone.replace(/\D/g, '')

  const { rows: customers } = await db.query(
    'SELECT id, language, name FROM customers WHERE phone = $1',
    [normalizedPhone]
  )

  const customer = customers[0]
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' })
  }

  await db.query(
    `INSERT INTO quotations (customer_id, quotation_ref, quotation_url, insurer, amount, status)
     VALUES ($1, $2, $3, $4, $5, 'sent')`,
    [customer.id, quotation_ref, quotation_url, insurer, amount]
  )

  const lang = customer.language ?? 'bm'
  const msgFn = QUOTATION_MSG[lang] ?? QUOTATION_MSG.bm
  const message = msgFn(quotation_url, insurer ?? 'insurans')

  await sendText(normalizedPhone, message)

  res.json({ sent: true })
})
