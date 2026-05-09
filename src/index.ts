import express from 'express'
import { startWAConnector, waEvents } from './modules/wa-connector/index.js'
import { handleIncomingMessage, handleIncomingImageMessage, handleIncomingPdfMessage, handleIncomingVideoMessage } from './pipeline.js'
import { config } from './config.js'
import { adminRouter, webhookRouter_ } from './modules/admin-api/index.js'
import { startWorkers } from './modules/scheduler/index.js'

const app = express()
app.use(express.json())

app.use('/admin', adminRouter)
app.use('/webhook', webhookRouter_)

waEvents.on('message', async ({ phone, text, pushName }: { phone: string; text: string; pushName?: string | null }) => {
  try {
    await handleIncomingMessage(phone, text, pushName)
  } catch (err) {
    console.error('Pipeline error:', err)
  }
})

waEvents.on('image', async ({ phone, buffer, mimetype, caption, pushName }: { phone: string; buffer: Buffer; mimetype: string; caption: string; pushName?: string | null }) => {
  try {
    await handleIncomingImageMessage(phone, buffer, mimetype, caption, pushName)
  } catch (err) {
    console.error('Image pipeline error:', err)
  }
})

waEvents.on('pdf', async ({ phone, buffer, pushName }: { phone: string; buffer: Buffer; pushName?: string | null }) => {
  try {
    await handleIncomingPdfMessage(phone, buffer, pushName)
  } catch (err) {
    console.error('PDF pipeline error:', err)
  }
})

waEvents.on('video', async ({ phone, buffer, caption, pushName }: { phone: string; buffer: Buffer; caption: string; pushName?: string | null }) => {
  try {
    await handleIncomingVideoMessage(phone, buffer, caption, pushName)
  } catch (err) {
    console.error('Video pipeline error:', err)
  }
})

waEvents.on('fatal-disconnect', () => {
  console.error('Fatal WA disconnect — check dashboard')
})

app.listen(config.port, () => {
  console.log(`API running on port ${config.port}`)
})

startWAConnector().catch(console.error)
startWorkers()
