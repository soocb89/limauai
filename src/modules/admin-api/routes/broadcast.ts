import { Router } from 'express'
import { db } from '../../../db/index.js'
import { broadcastQueue } from '../../scheduler/index.js'

export const broadcastRouter = Router()

broadcastRouter.post('/', async (req, res) => {
  const { promotionId, scheduledAt, filters } = req.body

  let sql = `SELECT cp.id AS customer_promotion_id, cp.customer_id
             FROM customer_promotions cp
             JOIN customers cu ON cu.id = cp.customer_id
             WHERE cp.promotion_id = $1 AND cp.status = 'pending'`
  const params: unknown[] = [promotionId]

  if (filters?.language) {
    params.push(filters.language)
    sql += ` AND cu.language = $${params.length}`
  }
  if (filters?.insurer) {
    params.push(filters.insurer)
    sql += ` AND cu.insurer = $${params.length}`
  }

  const { rows } = await db.query(sql, params)
  const delay = scheduledAt ? new Date(scheduledAt).getTime() - Date.now() : 0

  for (const row of rows) {
    await broadcastQueue.add(
      'send',
      { customerId: row.customer_id, promotionId, customerPromotionId: row.customer_promotion_id },
      { delay: delay > 0 ? delay : 0 }
    )
  }

  res.json({ queued: rows.length })
})

broadcastRouter.get('/:promotionId/stats', async (req, res) => {
  const { rows } = await db.query(
    `SELECT status, COUNT(*) AS count
     FROM customer_promotions WHERE promotion_id = $1 GROUP BY status`,
    [req.params.promotionId]
  )
  res.json(rows)
})
