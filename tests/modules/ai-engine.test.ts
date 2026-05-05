import { describe, it, expect, vi } from 'vitest'

vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Untuk renew insurans, layari website kami.' } }]
        })
      }
    }
  }
}))

vi.mock('../../src/db/index.js', () => ({
  db: { query: vi.fn().mockResolvedValue({ rows: [] }) }
}))

import { generateReply } from '../../src/modules/ai-engine/index.js'
import { buildSystemPrompt } from '../../src/modules/ai-engine/prompt-builder.js'

describe('buildSystemPrompt', () => {
  it('includes persona name', () => {
    const prompt = buildSystemPrompt(
      { tone: 'friendly', persona_name: 'Aina', language_fallback: 'bm' },
      [],
      [],
      'bm',
      'renewal_inquiry'
    )
    expect(prompt).toContain('Aina')
  })

  it('includes KB context when chunks provided', () => {
    const prompt = buildSystemPrompt(
      { tone: 'friendly', persona_name: 'Aina', language_fallback: 'bm' },
      [{ id: '1', title: 'FAQ', content: 'Renew online.' }],
      [],
      'bm',
      'renewal_inquiry'
    )
    expect(prompt).toContain('Renew online.')
  })
})

describe('generateReply', () => {
  it('returns string reply from OpenAI', async () => {
    const reply = await generateReply({
      userMessage: 'Macam mana nak renew?',
      language: 'bm',
      intent: 'renewal_inquiry',
      context: [],
      kbChunks: [],
      corrections: [],
      botConfig: { tone: 'friendly', persona_name: 'Aina', language_fallback: 'bm' },
      useGpt4: false,
    })
    expect(typeof reply).toBe('string')
    expect(reply.length).toBeGreaterThan(0)
  })
})
