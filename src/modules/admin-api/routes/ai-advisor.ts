import { Router } from 'express'
import { retrieveKB } from '../../kb-retriever/index.js'
import { generateReply, loadBotConfig, loadCorrections } from '../../ai-engine/index.js'

export const aiAdvisorRouter = Router()

interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

aiAdvisorRouter.post('/', async (req, res) => {
  const { message, history = [] } = req.body as { message: string; history: HistoryMessage[] }
  if (!message?.trim()) return res.status(400).json({ error: 'message required' })

  const [kbChunks, botConfig, corrections] = await Promise.all([
    retrieveKB(message, 5),
    loadBotConfig(),
    loadCorrections('general'),
  ])

  const context = history.map(m => ({
    id: '',
    conversation_id: '',
    role: m.role === 'assistant' ? 'bot' as const : 'user' as const,
    content: m.content,
    created_at: new Date(),
    intent: null,
    language: null,
    confidence: null,
    media_url: null,
  }))

  const reply = await generateReply({
    userMessage: message,
    language: 'en',
    intent: 'general',
    context,
    kbChunks,
    corrections,
    botConfig: {
      tone: botConfig.tone ?? 'professional',
      persona_name: botConfig.persona_name ?? 'LimauAI',
      language_fallback: botConfig.language_fallback ?? 'en',
      custom_instructions: botConfig.custom_instructions,
    },
    useGpt4: true,
  })

  res.json({ reply })
})
