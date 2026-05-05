import { describe, it, expect, vi } from 'vitest'

vi.mock('openai', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    data: [{ embedding: new Array(1536).fill(0.1) }]
  })
  class MockOpenAI {
    embeddings = { create: mockCreate }
  }
  return { default: MockOpenAI }
})

vi.mock('../../src/db/index.js', () => ({
  db: {
    query: vi.fn().mockResolvedValue({
      rows: [
        { id: 'kb-1', title: 'Insurance renewal FAQ', content: 'To renew insurance, visit our website.' }
      ]
    })
  }
}))

import { retrieveKB, addKBEntry } from '../../src/modules/kb-retriever/index.js'

describe('retrieveKB', () => {
  it('returns matching KB chunks', async () => {
    const results = await retrieveKB('How to renew insurance?')
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Insurance renewal FAQ')
  })

  it('passes topK to query', async () => {
    const { db } = await import('../../src/db/index.js')
    const results = await retrieveKB('query', 5)
    const call = vi.mocked(db.query).mock.calls.at(-1)
    expect(call?.[1]).toContain(5)
  })
})

describe('addKBEntry', () => {
  it('calls embedText and inserts into DB', async () => {
    const { db } = await import('../../src/db/index.js')
    vi.mocked(db.query).mockResolvedValueOnce({ rows: [{ id: 'new-id' }] } as any)

    const id = await addKBEntry({ title: 'Test', content: 'Content' })
    expect(id).toBe('new-id')
  })
})
