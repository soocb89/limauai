export interface MessageRow {
  id: string
  conversation_id: string
  role: 'user' | 'bot' | 'system'
  content: string
  intent: string | null
  language: string | null
  confidence: number | null
  media_url: string | null
  created_at: Date
}

export interface ConversationContext {
  conversationId: string
  customerId: string
  status: 'open' | 'handoff' | 'resolved'
  messages: MessageRow[]
  consecutiveUnknowns: number
}
