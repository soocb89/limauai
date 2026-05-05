import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConversationList } from '@/components/ConversationList'

const mockConversations = [
  {
    id: 1,
    phone: '60123456789',
    customer_name: 'Ali',
    status: 'open' as const,
    last_message_at: new Date().toISOString(),
    tags: ['renewal'],
  },
]

describe('ConversationList', () => {
  it('renders conversation names', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        selectedId={null}
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByText('Ali')).toBeTruthy()
  })

  it('shows empty state', () => {
    render(
      <ConversationList conversations={[]} selectedId={null} onSelect={vi.fn()} />
    )
    expect(screen.getByText('No conversations.')).toBeTruthy()
  })
})
