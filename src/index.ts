import express from 'express'
import { startWAConnector, waEvents } from './modules/wa-connector/index.js'
import { handleIncomingMessage } from './pipeline.js'
import { config } from './config.js'

const app = express()
app.use(express.json())

waEvents.on('message', async ({ phone, text }: { phone: string; text: string }) => {
  try {
    await handleIncomingMessage(phone, text)
  } catch (err) {
    console.error('Pipeline error:', err)
  }
})

waEvents.on('fatal-disconnect', () => {
  console.error('Fatal WA disconnect — check dashboard')
})

app.listen(config.port, () => {
  console.log(`API running on port ${config.port}`)
})

startWAConnector().catch(console.error)
