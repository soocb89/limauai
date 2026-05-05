import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/db/index.js', () => ({
  db: {
    query: vi.fn(),
  },
}))

import { db } from '../../src/db/index.js'
import {
  getOrCreateConversation,
  loadContext,
  saveMessage,
} from '../../src/modules/context-manager/index.js'

describe('getOrCreateConversation', () => {
  it('returns existing open conversation', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: [{ id: 'conv-1', customer_id: 'cust-1', status: 'open', tags: [] }],
    } as any)

    const conv = await getOrCreateConversation('cust-1')
    expect(conv.id).toBe('conv-1')
  })

  it('creates new conversation when none exists', async () => {
    vi.mocked(db.query)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [{ id: 'conv-new', customer_id: 'cust-1' }] } as any)

    const conv = await getOrCreateConversation('cust-1')
    expect(conv.id).toBe('conv-new')
  })
})

describe('loadContext', () => {
  it('returns last 20 messages for conversation', async () => {
    vi.mocked(db.query)
      .mockResolvedValueOnce({ rows: [{ id: 'conv-1', customer_id: 'cust-1', status: 'open', tags: [] }] } as any)
      .mockResolvedValueOnce({ rows: [{ id: 'msg-1', role: 'user', content: 'hello', intent: null, language: 'bm', confidence: null, created_at: new Date() }] } as any)

    const ctx = await loadContext('cust-1')
    expect(ctx.messages).toHaveLength(1)
    expect(ctx.messages[0].content).toBe('hello')
  })
})

describe('saveMessage', () => {
  it('inserts message and returns row', async () => {
    const mockMsg = { id: 'msg-1', conversation_id: 'conv-1', role: 'user', content: 'test', intent: null, language: 'bm', confidence: null, created_at: new Date() }
    vi.mocked(db.query).mockResolvedValueOnce({ rows: [mockMsg] } as any)

    const msg = await saveMessage({ conversationId: 'conv-1', role: 'user', content: 'test', language: 'bm' })
    expect(msg.id).toBe('msg-1')
    expect(msg.content).toBe('test')
  })
})
