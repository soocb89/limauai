import { Router } from 'express'
import { db } from '../../../db/index.js'

export const conversationsRouter = Router()

conversationsRouter.get('/', async (req, res) => {
  const { status } = req.query
  let sql = `
    SELECT c.id, c.status, c.tags, c.created_at, c.updated_at,
           cu.phone, cu.name, cu.language,
           (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.role = 'user') AS message_count
    FROM conversations c
    JOIN customers cu ON cu.id = c.customer_id
    WHERE 1=1`
  const params: unknown[] = []

  if (status) {
    params.push(status)
    sql += ` AND c.status = $${params.length}`
  }

  sql += ' ORDER BY c.updated_at DESC LIMIT 50'
  const { rows } = await db.query(sql, params)
  res.json(rows)
})

conversationsRouter.get('/:id/messages', async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, role, content, intent, language, confidence, created_at
     FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
    [req.params.id]
  )
  res.json(rows)
})

conversationsRouter.post('/:id/reply', async (req, res) => {
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'text required' })

  const { rows: conv } = await db.query(
    `SELECT c.id, cu.phone FROM conversations c
     JOIN customers cu ON cu.id = c.customer_id WHERE c.id = $1`,
    [req.params.id]
  )
  if (!conv[0]) return res.status(404).json({ error: 'Not found' })

  const { sendText } = await import('../../wa-connector/sender.js')
  await sendText(conv[0].phone, text)

  await db.query(
    `INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'bot', $2)`,
    [req.params.id, text]
  )
  await db.query(
    `UPDATE conversations SET status = 'open', updated_at = NOW() WHERE id = $1`,
    [req.params.id]
  )

  res.json({ sent: true })
})

conversationsRouter.patch('/:id/status', async (req, res) => {
  const { status } = req.body
  if (!['open', 'handoff', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }
  await db.query(
    `UPDATE conversations SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, req.params.id]
  )
  res.json({ updated: true })
})
