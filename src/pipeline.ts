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

const CONSENT_YES = /\b(ya|yes|nak|setuju|ok|okay|boleh|好|好的|是|可以)\b/i
const CONSENT_NO = /\b(tidak|no|tak nak|jangan|cancel|batal|tidak mahu|不|不要|不行|取消)\b/i

async function handleConsentReply(
  customerId: string,
  conversationId: string,
  text: string,
  language: string
): Promise<boolean> {
  const { rows } = await db.query(
    `SELECT fj.id FROM follow_up_jobs fj
     JOIN customers c ON c.id = fj.customer_id
     WHERE fj.customer_id = $1
       AND fj.type = 'renewal_reminder'
       AND fj.step = 't30'
       AND fj.status = 'sent'
       AND c.consent = false`,
    [customerId]
  )

  if (rows.length === 0) return false

  if (CONSENT_YES.test(text)) {
    await db.query(
      `UPDATE customers SET consent = true, consent_given_at = NOW() WHERE id = $1`,
      [customerId]
    )
    await saveMessage({ conversationId, role: 'system', content: '[consent given]', language })
    return true
  }

  if (CONSENT_NO.test(text)) {
    await db.query(
      `UPDATE follow_up_jobs SET status = 'cancelled'
       WHERE customer_id = $1 AND status = 'pending' AND type = 'renewal_reminder'`,
      [customerId]
    )
    await saveMessage({ conversationId, role: 'system', content: '[consent declined — renewal jobs cancelled]', language })
    return true
  }

  return false
}

export async function handleIncomingMessage(phone: string, text: string): Promise<void> {
  const customer = await getOrCreateCustomer(phone)
  const language = detectLanguage(text)

  if (!customer.language || customer.language !== language) {
    await db.query('UPDATE customers SET language = $1 WHERE id = $2', [language, customer.id])
  }

  const context = await loadContext(customer.id)
  await saveMessage({ conversationId: context.conversationId, role: 'user', content: text, language })

  const consentHandled = await handleConsentReply(customer.id, context.conversationId, text, language)
  if (consentHandled) return

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
