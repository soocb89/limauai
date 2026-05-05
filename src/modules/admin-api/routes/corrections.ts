import { Router } from 'express'
import { db } from '../../../db/index.js'

export const correctionsRouter = Router()

correctionsRouter.get('/', async (req, res) => {
  const { intent } = req.query
  let sql = `SELECT bc.id, bc.original_reply, bc.corrected_reply, bc.intent,
                    bc.created_at, m.content AS customer_message
             FROM bot_corrections bc
             LEFT JOIN messages m ON m.id = bc.message_id
             WHERE 1=1`
  const params: unknown[] = []
  if (intent) {
    params.push(intent)
    sql += ` AND bc.intent = $${params.length}`
  }
  sql += ' ORDER BY bc.created_at DESC LIMIT 50'
  const { rows } = await db.query(sql, params)
  res.json(rows)
})

correctionsRouter.post('/', async (req, res) => {
  const { messageId, originalReply, correctedReply, intent } = req.body
  const { rows } = await db.query(
    `INSERT INTO bot_corrections (message_id, original_reply, corrected_reply, intent)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [messageId, originalReply, correctedReply, intent]
  )
  res.status(201).json(rows[0])
})

correctionsRouter.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM bot_corrections WHERE id = $1', [req.params.id])
  res.json({ deleted: true })
})
