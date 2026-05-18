import { Router } from 'express'
import { db } from '../../../db/index.js'

export const analyticsRouter = Router()

analyticsRouter.get('/', async (_req, res) => {
  const { rows } = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE role = 'bot') AS ai_total,
      COUNT(*) FILTER (WHERE role = 'bot' AND created_at >= NOW() - INTERVAL '1 day') AS ai_today,
      COUNT(*) FILTER (WHERE role = 'bot' AND created_at >= NOW() - INTERVAL '7 days') AS ai_week
    FROM messages
  `)
  const msg = rows[0]

  const { rows: convRows } = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'handoff') AS handoff_total,
      COUNT(*) FILTER (WHERE status = 'handoff' AND updated_at >= NOW() - INTERVAL '1 day') AS handoff_today,
      COUNT(*) FILTER (WHERE status = 'handoff' AND updated_at >= NOW() - INTERVAL '7 days') AS handoff_week,
      COUNT(*) AS conv_total,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') AS conv_today,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS conv_week
    FROM conversations
  `)
  const conv = convRows[0]

  res.json({
    ai_messages: {
      total: Number(msg.ai_total),
      today: Number(msg.ai_today),
      week: Number(msg.ai_week),
    },
    handoffs: {
      total: Number(conv.handoff_total),
      today: Number(conv.handoff_today),
      week: Number(conv.handoff_week),
    },
    conversations: {
      total: Number(conv.conv_total),
      today: Number(conv.conv_today),
      week: Number(conv.conv_week),
    },
  })
})
