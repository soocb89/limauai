import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { requireApiKey } from '../../src/modules/admin-api/middleware/auth.js'

vi.mock('../../src/db/index.js', () => ({
  db: { query: vi.fn() }
}))

vi.mock('../../src/modules/scheduler/seed-renewal-jobs.js', () => ({
  scheduleRenewalJobs: vi.fn().mockResolvedValue(undefined)
}))

import { db } from '../../src/db/index.js'
import { customersRouter } from '../../src/modules/admin-api/routes/customers.js'

const app = express()
app.use(express.json())
app.use('/customers', requireApiKey, customersRouter)

const HEADERS = { 'x-api-key': 'test-key' }

describe('GET /customers', () => {
  beforeEach(() => {
    vi.mocked(db.query as any).mockReset()
  })

  it('returns customer list', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: [{ id: 'c1', phone: '60123456789', name: 'Ali', language: 'bm' }]
    } as any)

    const res = await request(app).get('/customers').set(HEADERS)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].phone).toBe('60123456789')
  })

  it('returns 401 without API key', async () => {
    const res = await request(app).get('/customers')
    expect(res.status).toBe(401)
  })
})
