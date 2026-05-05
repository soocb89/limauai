import type { WASocket } from '@whiskeysockets/baileys'

let _sock: WASocket | null = null

export function setSock(sock: WASocket) {
  _sock = sock
}

export async function sendText(phone: string, text: string): Promise<void> {
  if (!_sock) throw new Error('WA socket not initialized')
  const jid = phone.replace(/\D/g, '') + '@s.whatsapp.net'
  await _sock.sendMessage(jid, { text })
}
