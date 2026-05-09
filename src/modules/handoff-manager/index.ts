import { db } from '../../db/index.js'
import { sendText } from '../wa-connector/sender.js'
import { config } from '../../config.js'
import type { IntentResult } from '../intent-router/types.js'

const HANDOFF_KEYWORDS = ['human', 'agent', 'manusia', '人工', 'agen']

export function shouldHandoff(
  intentResult: IntentResult,
  consecutiveUnknowns: number,
  threshold: number
): boolean {
  if (intentResult.intent === 'complaint') return true
  if (intentResult.intent === 'escalation') return true
  if (intentResult.confidence < threshold) return true
  if (consecutiveUnknowns >= 3) return true
  return false
}

export function containsHandoffKeyword(text: string): boolean {
  const lower = text.toLowerCase()
  return HANDOFF_KEYWORDS.some(kw => lower.includes(kw))
}

export async function triggerHandoff(params: {
  phone: string
  customerId: string
  conversationId: string
  customerName: string | null
  intent: string
  language: string
  lastMessage: string
}): Promise<void> {
  const { rows } = await db.query(
    `SELECT value FROM bot_config WHERE key = $1`,
    [`handoff_hold_msg_${params.language}`]
  )
  const holdMsg = rows[0]?.value ?? 'Please wait, our agent will attend to you shortly.'

  await db.query(
    `UPDATE conversations SET status = 'handoff', updated_at = NOW() WHERE id = $1`,
    [params.conversationId]
  )

  const ownerAlert =
    `⚠️ Handoff needed: ${params.customerName ?? params.phone} (${params.phone})\n` +
    `Intent: ${params.intent} | Language: ${params.language}\n` +
    `Last message: ${params.lastMessage.slice(0, 100)}`

  const results = await Promise.allSettled([
    sendText(params.phone, holdMsg),
    sendText(config.owner.phone, ownerAlert),
  ])
  if (results[0].status === 'rejected') console.error('Handoff: failed to send hold msg to customer', results[0].reason)
  if (results[1].status === 'rejected') console.error('Handoff: failed to send alert to owner', results[1].reason)

  const { handoffAlertQueue } = await import('../scheduler/index.js')
  await handoffAlertQueue.add('handoff-alert', {
    conversationId: params.conversationId,
    customerName: params.customerName,
    phone: params.phone,
    handoffTriggeredAt: new Date().toISOString(),
    alertCount: 0,
  }, { delay: 30 * 60 * 1000 })
}
