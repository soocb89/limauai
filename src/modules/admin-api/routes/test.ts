import { Router } from 'express'
import { handleIncomingMessage } from '../../../pipeline.js'

export const testRouter = Router()

testRouter.post('/message', async (req, res) => {
  const { phone, message } = req.body
  if (!phone || !message) return res.status(400).json({ error: 'phone and message required' })
  try {
    await handleIncomingMessage(phone, message)
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
