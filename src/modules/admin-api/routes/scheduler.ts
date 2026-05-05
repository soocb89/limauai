import { Router } from 'express'
import { db } from '../../../db/index.js'

export const schedulerRouter = Router()

schedulerRouter.get('/jobs', async (_req, res) => {
  const { rows } = await db.query(
    `SELECT fj.id, fj.type, fj.step, fj.scheduled_at, fj.status,
            cu.phone, cu.name
     FROM follow_up_jobs fj
     JOIN customers cu ON cu.id = fj.customer_id
     WHERE fj.status = 'pending'
     ORDER BY fj.scheduled_at ASC LIMIT 100`
  )
  res.json(rows)
})

schedulerRouter.delete('/jobs/:id', async (req, res) => {
  await db.query(
    `UPDATE follow_up_jobs SET status = 'cancelled' WHERE id = $1`,
    [req.params.id]
  )
  res.json({ cancelled: true })
})
