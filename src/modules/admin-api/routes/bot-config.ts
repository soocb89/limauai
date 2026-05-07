import { Router } from 'express'
import { db } from '../../../db/index.js'

export const botConfigRouter = Router()

botConfigRouter.get('/', async (_req, res) => {
  const { rows } = await db.query('SELECT key, value FROM bot_config')
  res.json(Object.fromEntries(rows.map((r: { key: string; value: string }) => [r.key, r.value])))
})

const ALLOWED_BOT_CONFIG_KEYS = new Set([
  'tone', 'persona_name', 'language_fallback', 'handoff_threshold',
  'handoff_hold_msg_bm', 'handoff_hold_msg_zh', 'handoff_hold_msg_ta', 'handoff_hold_msg_en',
  'owner_phone',
])

botConfigRouter.put('/', async (req, res) => {
  const updates = req.body as Record<string, string>
  const unknown = Object.keys(updates).find(k => !ALLOWED_BOT_CONFIG_KEYS.has(k))
  if (unknown) return res.status(400).json({ error: `Unknown config key: ${unknown}` })

  for (const [key, value] of Object.entries(updates)) {
    await db.query(
      'INSERT INTO bot_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      [key, value]
    )
  }
  res.json({ updated: Object.keys(updates).length })
})
