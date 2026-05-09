import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import { EventEmitter } from 'events'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
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

async function loadLidMappingsFromDisk(sessionPath: string) {
  try {
    const files = await readdir(sessionPath)
    let count = 0
    for (const file of files) {
      if (!file.startsWith('lid-mapping-') || !file.endsWith('_reverse.json')) continue
      const phone = JSON.parse(await readFile(join(sessionPath, file), 'utf8'))
      const lid = file.replace('lid-mapping-', '').replace('_reverse.json', '')
      lidToPhone.set(`${lid}@lid`, phone)
      count++
    }
    if (count > 0) console.log(`[WA] pre-loaded ${count} LID mappings from disk`)
  } catch (err) {
    console.log('[WA] Could not load LID mappings from disk:', err)
  }
}

let reconnectAttempts = 0
const MAX_RECONNECT = 5

export async function startWAConnector(): Promise<void> {
  setWAStatus('connecting')
  await loadLidMappingsFromDisk(config.baileys.sessionPath)
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
    console.log(`[WA] contacts.upsert count=${contacts.length}`)
    for (const c of contacts) {
      const anyC = c as any
      if (anyC.lid) console.log(`[WA] contact with lid: id=${c.id} lid=${anyC.lid}`)
      registerContact(c.id, anyC.lid)
    }
  })
  sock.ev.on('contacts.update', (updates) => {
    for (const c of updates) {
      const anyC = c as any
      if (anyC.lid) console.log(`[WA] contact update with lid: id=${c.id} lid=${anyC.lid}`)
      registerContact(c.id, anyC.lid)
    }
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
          console.log(`[WA] LID not resolved yet: ${jid} — retrying in 5s`)
          const capturedMsg = msg
          setTimeout(() => {
            const retryPhone = lidToPhone.get(jid)
            if (!retryPhone) { console.log(`[WA] LID ${jid} still unresolved — dropping`); return }
            const text =
              capturedMsg.message?.conversation ??
              capturedMsg.message?.extendedTextMessage?.text ?? ''
            if (!text) return
            console.log(`[WA] LID retry resolved ${jid} → ${retryPhone}: "${text}"`)
            waEvents.emit('message', { phone: retryPhone, text, pushName: capturedMsg.pushName ?? null, raw: capturedMsg })
          }, 5000)
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

      const phone = jid.replace('@s.whatsapp.net', '')
      const pushName = msg.pushName ?? null

      if (msg.message.imageMessage) {
        const imageMessage = msg.message.imageMessage
        try {
          const { downloadMediaMessage } = await import('@whiskeysockets/baileys')
          const buffer = await downloadMediaMessage(msg, 'buffer', {})
          const mimetype = imageMessage.mimetype ?? 'image/jpeg'
          const caption = imageMessage.caption ?? ''
          console.log(`[WA] image from ${phone} (${pushName}): caption="${caption}"`)
          waEvents.emit('image', { phone, buffer, mimetype, caption, pushName })
        } catch (err) {
          console.error('[WA] failed to download image:', err)
          const { sendText } = await import('./sender.js')
          await sendText(phone, 'Maaf, kami tidak dapat memuat turun imej anda. Sila cuba lagi. / Sorry, we could not download your image. Please try again.')
        }
        continue
      }

      if (msg.message.documentMessage?.mimetype === 'application/pdf') {
        try {
          const { downloadMediaMessage } = await import('@whiskeysockets/baileys')
          const buffer = await downloadMediaMessage(msg, 'buffer', {})
          console.log(`[WA] PDF from ${phone} (${pushName})`)
          waEvents.emit('pdf', { phone, buffer, pushName })
        } catch (err) {
          console.error('[WA] failed to download PDF:', err)
          const { sendText } = await import('./sender.js')
          await sendText(phone, 'Maaf, kami tidak dapat memuat turun PDF anda. Sila cuba lagi. / Sorry, we could not download your PDF. Please try again.')
        }
        continue
      }

      if (msg.message.videoMessage) {
        try {
          const { downloadMediaMessage } = await import('@whiskeysockets/baileys')
          const buffer = await downloadMediaMessage(msg, 'buffer', {})
          const caption = msg.message.videoMessage.caption ?? ''
          console.log(`[WA] video from ${phone} (${pushName}): caption="${caption}"`)
          waEvents.emit('video', { phone, buffer, caption, pushName })
        } catch (err) {
          console.error('[WA] failed to download video:', err)
          const { sendText } = await import('./sender.js')
          await sendText(phone, 'Maaf, kami tidak dapat memuat turun video anda. Sila cuba lagi. / Sorry, we could not download your video. Please try again.')
        }
        continue
      }

      if (!text) {
        console.log(`[WA] skipping non-text: ${Object.keys(msg.message).join(',')}`)
        const { sendText } = await import('./sender.js')
        await sendText(phone, 'Terima kasih! Kami tidak dapat memproses fail jenis ini. Sila taip mesej anda. / We can\'t process this file type. Please type your message.')
        continue
      }

      console.log(`[WA] incoming from ${phone} (${pushName}): "${text}"`)
      waEvents.emit('message', { phone, text, pushName, raw: msg })
    }
  })
}
