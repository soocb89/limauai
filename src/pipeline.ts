import { detectLanguage } from './modules/language-detector/index.js'
import {
  loadContext,
  saveMessage,
  getOrCreateCustomer,
} from './modules/context-manager/index.js'
import { classifyIntent } from './modules/intent-router/index.js'
import { retrieveKB } from './modules/kb-retriever/index.js'
import {
  generateReply,
  loadBotConfig,
  loadCorrections,
} from './modules/ai-engine/index.js'
import {
  shouldHandoff,
  containsHandoffKeyword,
  triggerHandoff,
} from './modules/handoff-manager/index.js'
import { tagConversation } from './modules/tagger/index.js'
import { sendText } from './modules/wa-connector/sender.js'
import { db } from './db/index.js'

const COMPLEX_INTENTS = new Set(['complaint', 'quotation_request'])

export async function handleIncomingMessage(phone: string, text: string): Promise<void> {
  const customer = await getOrCreateCustomer(phone)
  const language = detectLanguage(text)

  if (!customer.language || customer.language !== language) {
    await db.query('UPDATE customers SET language = $1 WHERE id = $2', [language, customer.id])
  }

  const context = await loadContext(customer.id)
  await saveMessage({ conversationId: context.conversationId, role: 'user', content: text, language })

  if (containsHandoffKeyword(text)) {
    const { rows: customerRows } = await db.query('SELECT name FROM customers WHERE id = $1', [customer.id])
    await triggerHandoff({
      phone,
      customerId: customer.id,
      conversationId: context.conversationId,
      customerName: customerRows[0]?.name ?? null,
      intent: 'escalation',
      language,
      lastMessage: text,
    })
    return
  }

  const intentResult = await classifyIntent(text, context.messages)
  const botConfig = await loadBotConfig()
  const threshold = parseFloat(botConfig.handoff_threshold ?? '0.6')

  if (shouldHandoff(intentResult, context.consecutiveUnknowns, threshold)) {
    const { rows: customerRows } = await db.query('SELECT name FROM customers WHERE id = $1', [customer.id])
    await triggerHandoff({
      phone,
      customerId: customer.id,
      conversationId: context.conversationId,
      customerName: customerRows[0]?.name ?? null,
      intent: intentResult.intent,
      language,
      lastMessage: text,
    })
    await saveMessage({
      conversationId: context.conversationId,
      role: 'system',
      content: '[handoff triggered]',
      intent: intentResult.intent,
      language,
      confidence: intentResult.confidence,
    })
    return
  }

  const [kbChunks, corrections] = await Promise.all([
    retrieveKB(text),
    loadCorrections(intentResult.intent),
  ])

  const reply = await generateReply({
    userMessage: text,
    language,
    intent: intentResult.intent,
    context: context.messages,
    kbChunks,
    corrections,
    botConfig: {
      tone: botConfig.tone ?? 'friendly',
      persona_name: botConfig.persona_name ?? 'Aina',
      language_fallback: botConfig.language_fallback ?? 'bm',
    },
    useGpt4: COMPLEX_INTENTS.has(intentResult.intent),
  })

  await sendText(phone, reply)

  await saveMessage({
    conversationId: context.conversationId,
    role: 'bot',
    content: reply,
    intent: intentResult.intent,
    language,
    confidence: intentResult.confidence,
  })

  await tagConversation(context.conversationId, intentResult.intent, language)
}
