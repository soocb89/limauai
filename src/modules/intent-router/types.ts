export const INTENTS = [
  'renewal_inquiry',
  'roadtax_inquiry',
  'quotation_request',
  'payment_status',
  'document_upload',
  'promotion_inquiry',
  'complaint',
  'escalation',
  'general_faq',
  'unknown',
] as const

export type Intent = typeof INTENTS[number]

export interface IntentResult {
  intent: Intent
  confidence: number
}
