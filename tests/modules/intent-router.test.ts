import { describe, it, expect, vi } from 'vitest'

vi.mock('openai', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({ intent: 'renewal_inquiry', confidence: 0.95 })
      }
    }]
  })
  return {
    default: vi.fn().mockImplementation(function () {
      return {
        chat: { completions: { create: mockCreate } }
      }
    })
  }
})

import { classifyIntent } from '../../src/modules/intent-router/index.js'

describe('classifyIntent', () => {
  it('returns intent and confidence from OpenAI response', async () => {
    const result = await classifyIntent('Nak renew insurans kereta', [])
    expect(result.intent).toBe('renewal_inquiry')
    expect(result.confidence).toBe(0.95)
  })

  it('returns unknown with zero confidence on parse failure', async () => {
    const openai = await import('openai')
    vi.mocked(openai.default).mockImplementationOnce(function () {
      return {
        chat: { completions: { create: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'not json' } }] }) } }
      }
    } as any)

    const result = await classifyIntent('???', [])
    expect(result.intent).toBe('unknown')
    expect(result.confidence).toBe(0.0)
  })

  it('returns unknown if intent not in INTENTS list', async () => {
    const openai = await import('openai')
    vi.mocked(openai.default).mockImplementationOnce(function () {
      return {
        chat: { completions: { create: vi.fn().mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ intent: 'invalid_intent', confidence: 0.8 }) } }] }) } }
      }
    } as any)

    const result = await classifyIntent('something', [])
    expect(result.intent).toBe('unknown')
  })
})
