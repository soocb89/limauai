import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setSock, sendText } from '../../src/modules/wa-connector/sender.js'

describe('sendText', () => {
  it('formats phone to JID and calls sendMessage', async () => {
    const mockSock = { sendMessage: vi.fn().mockResolvedValue(undefined) }
    setSock(mockSock as any)

    await sendText('60123456789', 'Hello')

    expect(mockSock.sendMessage).toHaveBeenCalledWith(
      '60123456789@s.whatsapp.net',
      { text: 'Hello' }
    )
  })

  it('strips non-digits from phone', async () => {
    const mockSock = { sendMessage: vi.fn().mockResolvedValue(undefined) }
    setSock(mockSock as any)

    await sendText('+60-12-3456789', 'Hi')

    expect(mockSock.sendMessage).toHaveBeenCalledWith(
      '60123456789@s.whatsapp.net',
      { text: 'Hi' }
    )
  })

  it('throws if socket not set', async () => {
    setSock(null as any)
    await expect(sendText('60123456789', 'test')).rejects.toThrow('WA socket not initialized')
  })
})
