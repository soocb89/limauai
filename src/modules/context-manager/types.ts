export interface MessageRow {
  id: string
  conversation_id: string
  role: 'user' | 'bot' | 'system'
  content: string
  intent: string | null
  language: string | null
  confidence: number | null
  created_at: Date
}

export interface ConversationContext {
  conversationId: string
  customerId: string
  messages: MessageRow[]
  consecutiveUnknowns: number
}
