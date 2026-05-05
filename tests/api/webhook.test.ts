import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'

vi.mock('../../src/db/index.js', () => ({ db: { query: vi.fn() } }))
vi.mock('../../src/modules/wa-connector/sender.js', () => ({
  sendText: vi.fn().mockResolvedValue(undefined)
}))

import { db } from '../../src/db/index.js'
import { sendText } from '../../src/modules/wa-connector/sender.js'
import { webhookRouter } from '../../src/modules/admin-api/routes/webhook.js'

const app = express()
app.use(express.json())
app.use('/webhook', webhookRouter)

describe('POST /webhook/quotation', () => {
  beforeEach(() => {
    vi.mocked(db.query as any).mockReset()
    vi.mocked(sendText).mockClear()
  })

  it('saves quotation and sends WA message', async () => {
    vi.mocked(db.query)
      .mockResolvedValueOnce({ rows: [{ id: 'c1', language: 'bm', name: 'Ali' }] } as any)
      .mockResolvedValueOnce({ rows: [{ id: 'q1' }] } as any)

    const res = await request(app).post('/webhook/quotation').send({
      phone: '60123456789',
      quotation_url: 'https://insurer.com/quote/abc',
      quotation_ref: 'QT-001',
      insurer: 'Etiqa',
      amount: 1200,
    })

    expect(res.status).toBe(200)
    expect(vi.mocked(sendText)).toHaveBeenCalledWith(
      '60123456789',
      expect.stringContaining('insurer.com')
    )
  })
})
