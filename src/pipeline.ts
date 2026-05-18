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
  extractImageContext,
} from './modules/ai-engine/index.js'
import { preFilter } from './modules/ai-engine/pre-filter.js'
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
       AND fj.sent_at > NOW() - INTERVAL '48 hours'
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

export async function handleIncomingMessage(phone: string, text: string, pushName?: string | null): Promise<void> {
  const customer = await getOrCreateCustomer(phone)
  const language = detectLanguage(text)

  const updates: string[] = []
  const params: unknown[] = []

  if (!customer.language || customer.language !== language) {
    params.push(language); updates.push(`language = $${params.length}`)
  }
  // Always sync pushName — overrides placeholder names like "Add your name in the body"
  if (pushName && pushName !== customer.name) {
    params.push(pushName); updates.push(`name = $${params.length}`)
  }
  if (updates.length) {
    params.push(customer.id)
    await db.query(`UPDATE customers SET ${updates.join(', ')} WHERE id = $${params.length}`, params)
  }

  const [context, botConfig] = await Promise.all([
    loadContext(customer.id),
    loadBotConfig(),
  ])
  await saveMessage({ conversationId: context.conversationId, role: 'user', content: text, language })

  // Admin has taken over — save message for history but don't reply
  if (context.status === 'handoff') return

  const consentHandled = await handleConsentReply(customer.id, context.conversationId, text, language)
  if (consentHandled) return

  // Pre-filter: identity/jailbreak → hard-coded reply, no OpenAI cost
  const filtered = preFilter(text, language, botConfig.persona_name ?? 'Aina')
  if (filtered) {
    await sendText(phone, filtered)
    await saveMessage({ conversationId: context.conversationId, role: 'bot', content: filtered, language, confidence: 1 })
    return
  }

  if (containsHandoffKeyword(text)) {
    const { rows: customerRows } = await db.query('SELECT name FROM customers WHERE id = $1', [customer.id])
    await triggerHandoff({
      phone, customerId: customer.id, conversationId: context.conversationId,
      customerName: customerRows[0]?.name ?? null, intent: 'escalation', language, lastMessage: text,
    })
    return
  }

  const intentResult = await classifyIntent(text, context.messages)
  const threshold = parseFloat(botConfig.handoff_threshold ?? '0.6')

  // Always retrieve KB first so complaint/crash intents can still provide relevant info
  const [kbChunks, corrections] = await Promise.all([
    retrieveKB(text),
    loadCorrections(intentResult.intent),
  ])

  if (shouldHandoff(intentResult, context.consecutiveUnknowns, threshold)) {
    const { rows: customerRows } = await db.query('SELECT name FROM customers WHERE id = $1', [customer.id])

    // If KB has relevant info, send it before handing off
    if (kbChunks.length > 0) {
      const kbReply = await generateReply({
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
          custom_instructions: (botConfig.custom_instructions ?? '') +
            '\n\nIMPORTANT: After providing the helpful information above, end with a brief note that a human agent will follow up shortly.',
        },
        useGpt4: true,
      })
      await sendText(phone, kbReply)
      await saveMessage({
        conversationId: context.conversationId, role: 'bot', content: kbReply,
        intent: intentResult.intent, language, confidence: intentResult.confidence,
      })
    }

    await triggerHandoff({
      phone, customerId: customer.id, conversationId: context.conversationId,
      customerName: customerRows[0]?.name ?? null, intent: intentResult.intent, language, lastMessage: text,
    })
    await saveMessage({
      conversationId: context.conversationId, role: 'system', content: '[handoff triggered]',
      intent: intentResult.intent, language, confidence: intentResult.confidence,
    })
    return
  }

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
      custom_instructions: botConfig.custom_instructions ?? '',
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

export async function handleIncomingImageMessage(
  phone: string,
  imageBuffer: Buffer,
  mimetype: string,
  caption: string,
  pushName?: string | null
): Promise<void> {
  const customer = await getOrCreateCustomer(phone)
  const language = caption ? detectLanguage(caption) : 'bm'

  if (pushName && pushName !== customer.name) {
    await db.query(`UPDATE customers SET name = $1 WHERE id = $2`, [pushName, customer.id])
  }

  const [context, botConfig] = await Promise.all([
    loadContext(customer.id),
    loadBotConfig(),
  ])

  await saveMessage({
    conversationId: context.conversationId,
    role: 'user',
    content: caption || '[image]',
    language,
    mediaUrl: `data:${mimetype};base64,${imageBuffer.toString('base64')}`,
  })

  if (context.status === 'handoff') return

  const imageContext = await extractImageContext(imageBuffer, mimetype, caption)
  const [kbChunks, corrections] = await Promise.all([
    retrieveKB(imageContext),
    loadCorrections('document_upload'),
  ])

  const reply = await generateReply({
    userMessage: caption || imageContext,
    language,
    intent: 'document_upload',
    context: context.messages,
    kbChunks,
    corrections,
    botConfig: {
      tone: botConfig.tone ?? 'friendly',
      persona_name: botConfig.persona_name ?? 'Aina',
      language_fallback: botConfig.language_fallback ?? 'bm',
      custom_instructions: botConfig.custom_instructions ?? '',
    },
    useGpt4: false,
    imageData: { buffer: imageBuffer, mimetype },
  })

  await sendText(phone, reply)
  await saveMessage({ conversationId: context.conversationId, role: 'bot', content: reply, intent: 'document_upload', language, confidence: 1 })
  await tagConversation(context.conversationId, 'document_upload', language)
}

export async function handleIncomingPdfMessage(
  phone: string,
  pdfBuffer: Buffer,
  pushName?: string | null
): Promise<void> {
  let extractedText = ''
  try {
    const { default: pdfParse } = await import('pdf-parse') as any
    const data = await pdfParse(pdfBuffer)
    extractedText = data.text.slice(0, 3000).trim()
  } catch (err) {
    console.error('[PDF] extraction failed:', err)
    const { sendText } = await import('./modules/wa-connector/sender.js')
    await sendText(phone, 'Maaf, kami tidak dapat membaca PDF anda. Sila hantar dalam format teks. / Sorry, we could not read your PDF. Please send as text.')
    return
  }

  if (!extractedText) {
    const { sendText } = await import('./modules/wa-connector/sender.js')
    await sendText(phone, 'PDF anda kelihatan kosong atau tidak dapat dibaca. Sila cuba lagi. / Your PDF appears empty or unreadable. Please try again.')
    return
  }

  await handleIncomingMessage(phone, `[PDF content]: ${extractedText}`, pushName)
}

export async function handleIncomingVideoMessage(
  phone: string,
  videoBuffer: Buffer,
  caption: string,
  pushName?: string | null
): Promise<void> {
  try {
    const { extractVideoFrame } = await import('./utils/extract-frame.js')
    const frameBuffer = await extractVideoFrame(videoBuffer)
    await handleIncomingImageMessage(phone, frameBuffer, 'image/jpeg', caption, pushName)
  } catch (err) {
    console.error('[Video] frame extraction failed:', err)
    const { sendText } = await import('./modules/wa-connector/sender.js')
    await sendText(phone, 'Maaf, kami tidak dapat memproses video anda. Sila hantar gambar atau huraikan masalah anda dalam teks. / Sorry, we could not process your video. Please send a screenshot or describe your issue in text.')
  }
}
