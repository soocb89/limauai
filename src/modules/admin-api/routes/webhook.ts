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
