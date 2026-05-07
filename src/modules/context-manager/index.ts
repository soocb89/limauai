import { db } from '../../db/index.js'
import type { ConversationContext, MessageRow } from './types.js'

export async function getOrCreateConversation(customerId: string) {
  const { rows } = await db.query(
    `SELECT id, customer_id, status, tags
     FROM conversations
     WHERE customer_id = $1 AND status = 'open'
     ORDER BY created_at DESC LIMIT 1`,
    [customerId]
  )

  if (rows.length > 0) return rows[0]

  const { rows: newRows } = await db.query(
    `INSERT INTO conversations (customer_id) VALUES ($1) RETURNING id, customer_id, status, tags`,
    [customerId]
  )
  return newRows[0]
}

export async function loadContext(customerId: string): Promise<ConversationContext> {
  const conversation = await getOrCreateConversation(customerId)

  const { rows: messages } = await db.query<MessageRow>(
    `SELECT id, conversation_id, role, content, intent, language, confidence, created_at
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC
     LIMIT 20`,
    [conversation.id]
  )

  const consecutiveUnknowns = countTrailingUnknowns(messages)

  return {
    conversationId: conversation.id,
    customerId,
    messages,
    consecutiveUnknowns,
  }
}

export async function saveMessage(params: {
  conversationId: string
  role: 'user' | 'bot' | 'system'
  content: string
  intent?: string
  language?: string
  confidence?: number
}): Promise<MessageRow> {
  const { rows } = await db.query<MessageRow>(
    `INSERT INTO messages (conversation_id, role, content, intent, language, confidence)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [params.conversationId, params.role, params.content, params.intent ?? null, params.language ?? null, params.confidence ?? null]
  )
  return rows[0]
}

export async function getOrCreateCustomer(phone: string): Promise<{ id: string; language: string | null; name: string | null }> {
  const { rows } = await db.query(
    `SELECT id, language, name FROM customers WHERE phone = $1`,
    [phone]
  )
  if (rows.length > 0) return rows[0]

  const { rows: newRows } = await db.query(
    `INSERT INTO customers (phone, source) VALUES ($1, 'bot_captured') RETURNING id, language, name`,
    [phone]
  )
  return newRows[0]
}

function countTrailingUnknowns(messages: MessageRow[]): number {
  let count = 0
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user' && messages[i].intent === 'unknown') {
      count++
    } else if (messages[i].role === 'user') {
      break
    }
  }
  return count
}
