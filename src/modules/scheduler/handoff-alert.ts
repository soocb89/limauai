import { db } from '../../db/index.js'
import { sendText } from '../wa-connector/sender.js'
import { config } from '../../config.js'

interface HandoffAlertJobData {
  conversationId: string
  customerName: string | null
  phone: string
  handoffTriggeredAt: string
  alertCount: number
}

export async function processHandoffAlert(data: HandoffAlertJobData): Promise<void> {
  const { rows: convRows } = await db.query(
    `SELECT status FROM conversations WHERE id = $1`,
    [data.conversationId]
  )
  if (!convRows[0] || convRows[0].status !== 'handoff') return

  const { rows: replyRows } = await db.query(
    `SELECT id FROM messages
     WHERE conversation_id = $1 AND role = 'bot' AND created_at > $2
     LIMIT 1`,
    [data.conversationId, data.handoffTriggeredAt]
  )
  if (replyRows.length > 0) return

  const waitMins = data.alertCount === 0 ? 30 : 60
  const alert =
    `⏰ Reminder: ${data.customerName ?? data.phone} (${data.phone}) still waiting for reply.\n` +
    `Waiting ${waitMins}+ minutes. Conversation still on handoff.`

  await sendText(config.owner.phone, alert)
}
