import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CustomerTable } from '@/components/CustomerTable'

const mockCustomers = [
  {
    id: 1,
    name: 'Ali',
    phone: '60123456789',
    language: 'ms',
    insurer: 'Allianz',
    policy_expiry: '2026-12-31',
    tags: ['renewal'],
  },
]

describe('CustomerTable', () => {
  it('renders customer rows', () => {
    render(<CustomerTable customers={mockCustomers} />)
    expect(screen.getByText('Ali')).toBeTruthy()
    expect(screen.getByText('Allianz')).toBeTruthy()
  })

  it('shows empty state', () => {
    render(<CustomerTable customers={[]} />)
    expect(screen.getByText('No customers found.')).toBeTruthy()
  })
})
