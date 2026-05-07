import type { WASocket } from '@whiskeysockets/baileys'

let _sock: WASocket | null = null
let _ready = false

export function setSock(sock: WASocket) {
  _sock = sock
}

export function setReady(ready: boolean) {
  _ready = ready
}

function waitReady(timeoutMs = 15_000): Promise<void> {
  if (_ready) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs
    const interval = setInterval(() => {
      if (_ready) { clearInterval(interval); resolve() }
      else if (Date.now() > deadline) { clearInterval(interval); reject(new Error('WA not ready — connection timeout')) }
    }, 200)
  })
}

export async function sendText(phone: string, text: string): Promise<void> {
  await waitReady()
  if (!_sock) throw new Error('WA socket not initialized')
  const jid = phone.replace(/\D/g, '') + '@s.whatsapp.net'
  await _sock.sendMessage(jid, { text })
}
