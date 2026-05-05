import { describe, it, expect, vi } from 'vitest'

vi.mock('../../src/modules/wa-connector/sender.js', () => ({
  sendText: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/db/index.js', () => ({
  db: { query: vi.fn().mockResolvedValue({ rows: [{ value: 'Sila tunggu.' }] }) }
}))

import { shouldHandoff } from '../../src/modules/handoff-manager/index.js'
import type { IntentResult } from '../../src/modules/intent-router/types.js'

describe('shouldHandoff', () => {
  const baseResult: IntentResult = { intent: 'renewal_inquiry', confidence: 0.9 }

  it('triggers on complaint intent', () => {
    expect(shouldHandoff({ ...baseResult, intent: 'complaint' }, 0, 0.6)).toBe(true)
  })

  it('triggers on escalation intent', () => {
    expect(shouldHandoff({ ...baseResult, intent: 'escalation' }, 0, 0.6)).toBe(true)
  })

  it('triggers when confidence below threshold', () => {
    expect(shouldHandoff({ ...baseResult, confidence: 0.4 }, 0, 0.6)).toBe(true)
  })

  it('triggers on 3+ consecutive unknowns', () => {
    expect(shouldHandoff({ ...baseResult, intent: 'unknown' }, 3, 0.6)).toBe(true)
  })

  it('does not trigger for normal intent with good confidence', () => {
    expect(shouldHandoff(baseResult, 0, 0.6)).toBe(false)
  })
})
