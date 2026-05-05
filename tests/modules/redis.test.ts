import { describe, it, expect, afterAll } from 'vitest'
import { redis } from '../../src/redis/index.js'

describe('redis client', () => {
  it('connects and pings', async () => {
    const result = await redis.ping()
    expect(result).toBe('PONG')
  })

  afterAll(async () => {
    await redis.quit()
  })
})
