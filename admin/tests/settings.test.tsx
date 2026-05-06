import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BotConfigForm } from '@/components/BotConfigForm'

vi.mock('@/hooks/use-bot-config', () => ({
  useBotConfig: () => ({
    data: { tone: 'friendly', model: 'gpt-4o-mini', owner_phone: '601234', handoff_threshold: '0.3', max_unknowns: '3' },
    isLoading: false,
  }),
  useUpdateBotConfig: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

describe('BotConfigForm', () => {
  it('renders settings fields', () => {
    render(<BotConfigForm />)
    expect(screen.getByPlaceholderText('e.g. friendly, professional')).toBeTruthy()
    expect(screen.getByPlaceholderText('gpt-4o-mini')).toBeTruthy()
  })
})
