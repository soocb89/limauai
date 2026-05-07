import { Router } from 'express'
import { randomBytes } from 'crypto'
import { db } from '../../../db/index.js'

export const webhooksRouter = Router()

webhooksRouter.get('/', async (_req, res) => {
  const { rows } = await db.query('SELECT * FROM webhooks ORDER BY created_at DESC')
  res.json(rows)
})

webhooksRouter.post('/', async (req, res) => {
  const { name, description } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  const token = randomBytes(32).toString('hex')
  const { rows } = await db.query(
    `INSERT INTO webhooks (name, token, description) VALUES ($1,$2,$3) RETURNING *`,
    [name, token, description ?? null]
  )
  res.status(201).json(rows[0])
})

webhooksRouter.delete('/:id', async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM webhooks WHERE id = $1', [req.params.id])
  if (!rowCount) return res.status(404).json({ error: 'Not found' })
  res.json({ deleted: true })
})
