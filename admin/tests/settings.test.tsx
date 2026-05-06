import { describe, it, expect, vi } from 'vitest'

vi.mock('@/hooks/use-bot-config')

describe('BotConfigForm', () => {
  it('component can be imported', async () => {
    const { BotConfigForm } = await import('@/components/BotConfigForm')
    expect(BotConfigForm).toBeDefined()
  })
})
