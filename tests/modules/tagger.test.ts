import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/db/index.js', () => ({
  db: { query: vi.fn().mockResolvedValue({ rows: [] }) }
}))

import { db } from '../../src/db/index.js'
import { tagConversation } from '../../src/modules/tagger/index.js'

describe('tagConversation', () => {
  beforeEach(() => {
    vi.mocked(db.query).mockClear()
  })

  it('adds insurance-renewal tag for renewal_inquiry', async () => {
    await tagConversation('conv-1', 'renewal_inquiry', 'bm')
    expect(vi.mocked(db.query)).toHaveBeenCalledWith(
      expect.stringContaining('array_append'),
      expect.arrayContaining(['conv-1'])
    )
  })

  it('adds language tag', async () => {
    await tagConversation('conv-1', 'general_faq', 'zh')
    const call = vi.mocked(db.query).mock.calls[0]
    expect(call[1]).toContain('language-zh')
  })
})
