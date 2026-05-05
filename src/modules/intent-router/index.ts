import OpenAI from 'openai'
import { config } from '../../config.js'
import type { Intent, IntentResult } from './types.js'
import { INTENTS } from './types.js'
import type { MessageRow } from '../context-manager/types.js'


const SYSTEM_PROMPT = `You are an intent classifier for a Malaysian car insurance renewal chatbot.

Classify the user's message into exactly one of these intents:
${INTENTS.join(', ')}

Definitions:
- renewal_inquiry: asking about renewing car insurance
- roadtax_inquiry: asking about road tax (roadtax) renewal
- quotation_request: requesting a price quote
- payment_status: asking about payment or payment confirmation
- document_upload: sending or asking about documents (IC, grant, etc.)
- promotion_inquiry: asking about promotions or discounts
- complaint: expressing dissatisfaction or complaint
- escalation: explicitly requesting a human agent
- general_faq: general question answerable from FAQ
- unknown: cannot be classified

Respond with JSON only: {"intent": "<intent>", "confidence": <0.0-1.0>}`

export async function classifyIntent(
  text: string,
  recentMessages: MessageRow[]
): Promise<IntentResult> {
  const openai = new OpenAI({ apiKey: config.openai.apiKey })
  const history = recentMessages.slice(-5).map(m => ({
    role: m.role === 'bot' ? 'assistant' as const : 'user' as const,
    content: m.content,
  }))

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    })

    const parsed = JSON.parse(response.choices[0].message.content ?? '{}')
    const intent = INTENTS.includes(parsed.intent) ? parsed.intent as Intent : 'unknown'
    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.0

    return { intent, confidence }
  } catch {
    return { intent: 'unknown', confidence: 0.0 }
  }
}
