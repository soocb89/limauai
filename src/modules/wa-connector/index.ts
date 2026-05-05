import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import { EventEmitter } from 'events'
import { config } from '../../config.js'
import { setSock } from './sender.js'

export const waEvents = new EventEmitter()

let reconnectAttempts = 0
const MAX_RECONNECT = 3

export async function startWAConnector(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(config.baileys.sessionPath)

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  })

  setSock(sock)
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
      const loggedOut = statusCode === DisconnectReason.loggedOut

      if (loggedOut) {
        console.error('WA: Logged out. Delete session and restart.')
        return
      }

      reconnectAttempts++
      if (reconnectAttempts > MAX_RECONNECT) {
        console.error(`WA: ${MAX_RECONNECT} reconnect attempts failed.`)
        waEvents.emit('fatal-disconnect')
        return
      }

      const delay = Math.pow(2, reconnectAttempts) * 1000
      console.log(`WA: Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`)
      setTimeout(() => startWAConnector(), delay)
      return
    }

    if (connection === 'open') {
      reconnectAttempts = 0
      console.log('WA: Connected')
      waEvents.emit('ready')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (msg.key.fromMe) continue
      if (!msg.message) continue
      const text =
        msg.message.conversation ??
        msg.message.extendedTextMessage?.text ??
        ''
      if (!text) continue
      const phone = msg.key.remoteJid?.replace('@s.whatsapp.net', '') ?? ''
      waEvents.emit('message', { phone, text, raw: msg })
    }
  })
}
