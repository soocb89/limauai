import { db } from '../../db/index.js'
import { sendText } from '../wa-connector/sender.js'

interface BroadcastJobData {
  customerId: string
  promotionId: string
  customerPromotionId: string
}

export async function processBroadcastMessage(data: BroadcastJobData): Promise<void> {
  const { rows: customers } = await db.query(
    'SELECT id, phone, language FROM customers WHERE id = $1',
    [data.customerId]
  )
  const customer = customers[0]
  if (!customer) return

  const lang = customer.language ?? 'bm'

  const { rows: promos } = await db.query(
    `SELECT message_template_bm, message_template_zh, message_template_ta, message_template_en
     FROM promotions WHERE id = $1 AND active = true`,
    [data.promotionId]
  )
  const promo = promos[0]
  if (!promo) return

  const templateKey = `message_template_${lang}` as keyof typeof promo
  const message: string = promo[templateKey] ?? promo.message_template_bm ?? promo.message_template_en ?? ''
  if (!message) return

  await sendText(customer.phone, message)

  await db.query(
    `UPDATE customer_promotions SET status = 'sent', sent_at = NOW() WHERE id = $1`,
    [data.customerPromotionId]
  )
}
