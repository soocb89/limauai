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
import { setSock, setReady } from './sender.js'
import { setWAStatus, setWAQR } from './status.js'

export const waEvents = new EventEmitter()

// LID (Linked Identity) → phone number resolution map.
// WA multi-device sends some messages with @lid JIDs instead of phone JIDs.
// We build this map from contacts.upsert/update events so we can resolve them.
const lidToPhone = new Map<string, string>()

function registerContact(id?: string, lid?: string) {
  if (id?.endsWith('@s.whatsapp.net') && lid) {
    const lidJid = lid.endsWith('@lid') ? lid : `${lid}@lid`
    lidToPhone.set(lidJid, id.replace('@s.whatsapp.net', ''))
  }
}

let reconnectAttempts = 0
const MAX_RECONNECT = 5

export async function startWAConnector(): Promise<void> {
  setWAStatus('connecting')
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

  // Build LID→phone map from contact sync events
  sock.ev.on('contacts.upsert', (contacts) => {
    for (const c of contacts) registerContact(c.id, (c as any).lid)
  })
  sock.ev.on('contacts.update', (updates) => {
    for (const c of updates) registerContact(c.id, (c as any).lid)
  })

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      setWAStatus('qr_ready')
      setWAQR(qr)
      console.log('\n=== SCAN THIS QR WITH WHATSAPP ===')
      qrcode.generate(qr, { small: true })
      console.log('==================================\n')
    }

    if (connection === 'close') {
      setReady(false)
      setWAStatus('disconnected')
      setWAQR(null)
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
      setReady(true)
      setWAStatus('connected')
      setWAQR(null)
      console.log('WA: Connected ✓')
      waEvents.emit('ready')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (msg.key.fromMe) continue
      if (!msg.message) continue

      let jid = msg.key.remoteJid ?? ''

      // Resolve @lid JID to phone number via contact map
      if (jid.endsWith('@lid')) {
        const resolved = lidToPhone.get(jid)
        if (!resolved) {
          console.log(`[WA] LID not resolved yet: ${jid} — skipping`)
          continue
        }
        jid = `${resolved}@s.whatsapp.net`
        console.log(`[WA] resolved LID ${msg.key.remoteJid} → ${jid}`)
      }

      if (!jid.endsWith('@s.whatsapp.net')) continue

      const text =
        msg.message.conversation ??
        msg.message.extendedTextMessage?.text ??
        ''
      if (!text) {
        console.log(`[WA] skipping non-text: ${Object.keys(msg.message).join(',')}`)
        continue
      }

      const phone = jid.replace('@s.whatsapp.net', '')
      const pushName = msg.pushName ?? null
      console.log(`[WA] incoming from ${phone} (${pushName}): "${text}"`)
      waEvents.emit('message', { phone, text, pushName, raw: msg })
    }
  })
}
