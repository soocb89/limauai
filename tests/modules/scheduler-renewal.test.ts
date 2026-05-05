import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/modules/wa-connector/sender.js', () => ({
  sendText: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/db/index.js', () => ({
  db: { query: vi.fn() }
}))

import { db } from '../../src/db/index.js'
import { sendText } from '../../src/modules/wa-connector/sender.js'
import { processRenewalStep } from '../../src/modules/scheduler/renewal.js'

describe('processRenewalStep', () => {
  beforeEach(() => {
    vi.mocked(db.query).mockReset()
    vi.mocked(sendText).mockClear()
    vi.mocked(db.query)
      .mockResolvedValueOnce({ rows: [{ id: 'c1', phone: '60123456789', name: 'Ali', language: 'bm', insurer: 'Etiqa', consent: false, renewal_date: new Date() }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
  })

  it('sends t30 consent request message', async () => {
    await processRenewalStep({ customerId: 'c1', step: 't30' })
    expect(vi.mocked(sendText)).toHaveBeenCalledWith(
      '60123456789',
      expect.stringContaining('30 hari')
    )
  })
})
