import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/modules/wa-connector/sender.js', () => ({
  sendText: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/db/index.js', () => ({
  db: { query: vi.fn() }
}))

import { db } from '../../src/db/index.js'
import { sendText } from '../../src/modules/wa-connector/sender.js'
import { processBroadcastMessage } from '../../src/modules/scheduler/broadcast.js'

describe('processBroadcastMessage', () => {
  beforeEach(() => {
    vi.mocked(sendText).mockClear()
    vi.mocked(db.query as any).mockReset()
  })

  it('sends promotion message in customer language', async () => {
    vi.mocked(db.query)
      .mockResolvedValueOnce({ rows: [{ id: 'c1', phone: '60123456789', language: 'zh' }] } as any)
      .mockResolvedValueOnce({ rows: [{ message_template_bm: 'Promosi!', message_template_zh: '促销活动！', message_template_ta: null, message_template_en: 'Promo!' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)

    await processBroadcastMessage({ customerId: 'c1', promotionId: 'p1', customerPromotionId: 'cp1' })

    expect(vi.mocked(sendText)).toHaveBeenCalledWith('60123456789', '促销活动！')
  })

  it('skips if promotion inactive or missing', async () => {
    vi.mocked(db.query)
      .mockResolvedValueOnce({ rows: [{ id: 'c1', phone: '60123456789', language: 'bm' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)

    await processBroadcastMessage({ customerId: 'c1', promotionId: 'p1', customerPromotionId: 'cp1' })

    expect(vi.mocked(sendText)).not.toHaveBeenCalled()
  })
})
