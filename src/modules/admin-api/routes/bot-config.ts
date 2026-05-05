import { Router } from 'express'
import { db } from '../../../db/index.js'

export const botConfigRouter = Router()

botConfigRouter.get('/', async (_req, res) => {
  const { rows } = await db.query('SELECT key, value FROM bot_config')
  res.json(Object.fromEntries(rows.map((r: { key: string; value: string }) => [r.key, r.value])))
})

botConfigRouter.put('/', async (req, res) => {
  const updates = req.body as Record<string, string>
  for (const [key, value] of Object.entries(updates)) {
    await db.query(
      'INSERT INTO bot_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      [key, value]
    )
  }
  res.json({ updated: Object.keys(updates).length })
})
