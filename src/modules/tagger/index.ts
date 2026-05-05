import { db } from '../../db/index.js'
import type { Intent } from '../intent-router/types.js'

const INTENT_TAGS: Partial<Record<Intent, string>> = {
  renewal_inquiry: 'insurance-renewal',
  roadtax_inquiry: 'roadtax-renewal',
  quotation_request: 'quotation-sent',
  payment_status: 'payment-confirmed',
  document_upload: 'document-uploaded',
  complaint: 'complaint',
  escalation: 'handoff',
}

export async function tagConversation(
  conversationId: string,
  intent: Intent | string,
  language: string
): Promise<void> {
  const tags: string[] = [`language-${language}`]
  const intentTag = INTENT_TAGS[intent as Intent]
  if (intentTag) tags.push(intentTag)

  for (const tag of tags) {
    await db.query(
      `UPDATE conversations
       SET tags = array_append(COALESCE(tags, '{}'), $2),
       updated_at = NOW()
       WHERE id = $1 AND NOT ($2 = ANY(COALESCE(tags, '{}')))`,
      [conversationId, tag]
    )
  }
}
