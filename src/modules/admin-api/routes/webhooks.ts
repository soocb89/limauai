import { Router } from 'express'
import { randomBytes } from 'crypto'
import { db } from '../../../db/index.js'

export const webhooksRouter = Router()

webhooksRouter.get('/', async (_req, res) => {
  const { rows } = await db.query('SELECT * FROM webhooks ORDER BY created_at DESC')
  res.json(rows)
})

webhooksRouter.post('/', async (req, res) => {
  const { name, description, fields, message_template } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  const token = randomBytes(32).toString('hex')
  const { rows } = await db.query(
    `INSERT INTO webhooks (name, token, description, fields, message_template)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [name, token, description ?? null, JSON.stringify(fields ?? []), message_template ?? null]
  )
  res.status(201).json(rows[0])
})

webhooksRouter.put('/:id', async (req, res) => {
  const { name, description, fields, message_template } = req.body
  const { rows } = await db.query(
    `UPDATE webhooks SET name=$1, description=$2, fields=$3, message_template=$4
     WHERE id=$5 RETURNING *`,
    [name, description ?? null, JSON.stringify(fields ?? []), message_template ?? null, req.params.id]
  )
  if (!rows[0]) return res.status(404).json({ error: 'Not found' })
  res.json(rows[0])
})

webhooksRouter.delete('/:id', async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM webhooks WHERE id = $1', [req.params.id])
  if (!rowCount) return res.status(404).json({ error: 'Not found' })
  res.json({ deleted: true })
})
