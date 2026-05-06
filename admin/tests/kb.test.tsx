import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KBTable } from '@/components/KBTable'

const mockEntries = [
  {
    id: 1,
    title: 'Roadtax FAQ',
    content: 'Roadtax must be renewed annually.',
    category: 'faq',
    created_at: new Date().toISOString(),
  },
]

vi.mock('@/hooks/use-kb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/use-kb')>()
  return {
    ...actual,
    useDeleteKB: () => ({ mutateAsync: vi.fn(), isPending: false }),
  }
})

describe('KBTable', () => {
  it('renders KB entries', () => {
    render(<KBTable entries={mockEntries} onEdit={vi.fn()} />)
    expect(screen.getByText('Roadtax FAQ')).toBeTruthy()
  })

  it('shows empty state', () => {
    render(<KBTable entries={[]} onEdit={vi.fn()} />)
    expect(screen.getByText('No KB entries.')).toBeTruthy()
  })
})
