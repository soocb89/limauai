import OpenAI from 'openai'
import { config } from '../../config.js'
import { buildSystemPrompt } from './prompt-builder.js'
import { db } from '../../db/index.js'
import type { KBChunk } from '../kb-retriever/index.js'
import type { MessageRow } from '../context-manager/types.js'

const openai = new OpenAI({ apiKey: config.openai.apiKey })

interface GenerateReplyInput {
  userMessage: string
  language: string
  intent: string
  context: MessageRow[]
  kbChunks: KBChunk[]
  corrections: Array<{ corrected_reply: string; intent: string }>
  botConfig: { tone: string; persona_name: string; language_fallback: string; custom_instructions?: string }
  useGpt4: boolean
  imageData?: { buffer: Buffer; mimetype: string }
}

export async function generateReply(input: GenerateReplyInput): Promise<string> {
  const systemPrompt = buildSystemPrompt(
    input.botConfig,
    input.kbChunks,
    input.corrections,
    input.language,
    input.intent
  )

  const history = input.context.slice(-10).map(m => ({
    role: m.role === 'bot' ? 'assistant' as const : 'user' as const,
    content: m.content,
  }))

  const userContent = input.imageData
    ? [
        { type: 'image_url' as const, image_url: { url: `data:${input.imageData.mimetype};base64,${input.imageData.buffer.toString('base64')}` } },
        { type: 'text' as const, text: input.userMessage || 'Tolong bantu saya dengan imej ini.' },
      ]
    : input.userMessage

  const response = await openai.chat.completions.create({
    model: (input.useGpt4 || input.imageData) ? 'gpt-4o' : 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userContent },
    ],
    temperature: 0.7,
    max_tokens: input.imageData ? 500 : 300,
  })

  return response.choices[0].message.content ?? ''
}

export async function extractImageContext(imageBuffer: Buffer, mimetype: string, caption: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimetype};base64,${imageBuffer.toString('base64')}` } },
        { type: 'text', text: `Caption: "${caption}". In 1-2 sentences, describe what insurance or roadtax related information the customer is asking about or showing. Be specific about any visible numbers, dates, or document types.` },
      ],
    }],
    temperature: 0,
    max_tokens: 150,
  })
  return response.choices[0].message.content ?? caption
}

export async function loadBotConfig(): Promise<Record<string, string>> {
  const { rows } = await db.query('SELECT key, value FROM bot_config')
  return Object.fromEntries(rows.map((r: { key: string; value: string }) => [r.key, r.value]))
}

export async function loadCorrections(intent: string) {
  const { rows } = await db.query(
    `SELECT corrected_reply, intent FROM bot_corrections WHERE intent = $1 LIMIT 5`,
    [intent]
  )
  return rows
}
