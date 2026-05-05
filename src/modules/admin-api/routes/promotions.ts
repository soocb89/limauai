import { Router } from 'express'
import { db } from '../../../db/index.js'

export const promotionsRouter = Router()

promotionsRouter.get('/', async (_req, res) => {
  const { rows } = await db.query('SELECT * FROM promotions ORDER BY created_at DESC')
  res.json(rows)
})

promotionsRouter.post('/', async (req, res) => {
  const { name, description, start_date, end_date, message_template_bm, message_template_zh, message_template_ta, message_template_en } = req.body
  const { rows } = await db.query(
    `INSERT INTO promotions (name, description, start_date, end_date, message_template_bm, message_template_zh, message_template_ta, message_template_en)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [name, description, start_date, end_date, message_template_bm, message_template_zh, message_template_ta, message_template_en]
  )
  res.status(201).json(rows[0])
})

promotionsRouter.put('/:id', async (req, res) => {
  const { name, description, start_date, end_date, message_template_bm, message_template_zh, message_template_ta, message_template_en, active } = req.body
  const { rows } = await db.query(
    `UPDATE promotions SET name=$1, description=$2, start_date=$3, end_date=$4,
     message_template_bm=$5, message_template_zh=$6, message_template_ta=$7, message_template_en=$8, active=$9
     WHERE id=$10 RETURNING *`,
    [name, description, start_date, end_date, message_template_bm, message_template_zh, message_template_ta, message_template_en, active, req.params.id]
  )
  res.json(rows[0])
})

promotionsRouter.post('/:id/tag-customers', async (req, res) => {
  const { customerIds } = req.body as { customerIds: string[] }
  let tagged = 0
  for (const customerId of customerIds) {
    await db.query(
      `INSERT INTO customer_promotions (customer_id, promotion_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [customerId, req.params.id]
    )
    tagged++
  }
  res.json({ tagged })
})
