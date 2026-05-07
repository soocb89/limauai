import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import { EventEmitter } from 'events'
import qrcode from 'qrcode-terminal'
import { config } from '../../config.js'
import { setSock } from './sender.js'

export const waEvents = new EventEmitter()

// Module-level var intentionally — recursive startWAConnector() calls share this binding,
// so the reset on connection === 'open' correctly clears the count across all call frames.
let reconnectAttempts = 0
const MAX_RECONNECT = 5

export async function startWAConnector(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(config.baileys.sessionPath)
  const { version } = await fetchLatestBaileysVersion()
  console.log(`WA: using version ${version.join('.')}`)

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, undefined as any),
    },
    browser: ['LimauAI', 'Chrome', '120.0.0'],
    connectTimeoutMs: 60_000,
    keepAliveIntervalMs: 10_000,
  })

  setSock(sock)
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\n=== SCAN THIS QR WITH WHATSAPP ===')
      qrcode.generate(qr, { small: true })
      console.log('==================================\n')
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
      const loggedOut = statusCode === DisconnectReason.loggedOut

      if (loggedOut) {
        console.error('WA: Logged out. Delete session folder and restart.')
        waEvents.emit('fatal-disconnect')
        return
      }

      reconnectAttempts++
      if (reconnectAttempts > MAX_RECONNECT) {
        console.error(`WA: ${MAX_RECONNECT} reconnect attempts failed.`)
        waEvents.emit('fatal-disconnect')
        return
      }

      const delay = Math.min(Math.pow(2, reconnectAttempts) * 1000, 30_000)
      console.log(`WA: Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`)
      setTimeout(() => startWAConnector(), delay)
      return
    }

    if (connection === 'open') {
      reconnectAttempts = 0
      console.log('WA: Connected ✓')
      waEvents.emit('ready')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (msg.key.fromMe) continue
      if (!msg.message) continue
      const jid = msg.key.remoteJid ?? ''
      if (!jid.endsWith('@s.whatsapp.net')) continue // skip groups, LIDs, broadcasts
      const text =
        msg.message.conversation ??
        msg.message.extendedTextMessage?.text ??
        ''
      if (!text) continue
      const phone = jid.replace('@s.whatsapp.net', '')
      const pushName = msg.pushName ?? null
      waEvents.emit('message', { phone, text, pushName, raw: msg })
    }
  })
}
