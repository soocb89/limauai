import { describe, it, expect, vi } from 'vitest'
import express from 'express'
import request from 'supertest'

vi.mock('../../src/db/index.js', () => ({ db: { query: vi.fn() } }))
vi.mock('../../src/modules/kb-retriever/embedder.js', () => ({
  embedText: vi.fn().mockResolvedValue(new Array(1536).fill(0.1))
}))
vi.mock('../../src/modules/kb-retriever/index.js', () => ({
  addKBEntry: vi.fn().mockResolvedValue('kb-1'),
  retrieveKB: vi.fn().mockResolvedValue([])
}))

import { db } from '../../src/db/index.js'
import { kbRouter } from '../../src/modules/admin-api/routes/knowledge-base.js'

const app = express()
app.use(express.json())
app.use('/kb', kbRouter)

describe('GET /kb/gaps', () => {
  it('returns intents with low confidence messages', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: [{ intent: 'general_faq', avg_confidence: 0.35, count: '5' }]
    } as any)

    const res = await request(app).get('/kb/gaps')
    expect(res.status).toBe(200)
    expect(res.body[0].intent).toBe('general_faq')
  })
})
