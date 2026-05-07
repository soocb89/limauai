import { Router } from 'express'
import { requireApiKey } from './middleware/auth.js'
import { customersRouter } from './routes/customers.js'
import { conversationsRouter } from './routes/conversations.js'
import { kbRouter } from './routes/knowledge-base.js'
import { promotionsRouter } from './routes/promotions.js'
import { broadcastRouter } from './routes/broadcast.js'
import { schedulerRouter } from './routes/scheduler.js'
import { botConfigRouter } from './routes/bot-config.js'
import { correctionsRouter } from './routes/corrections.js'
import { webhookRouter } from './routes/webhook.js'
import { testRouter } from './routes/test.js'
import { webhooksRouter } from './routes/webhooks.js'

export const adminRouter = Router()

adminRouter.use(requireApiKey)
adminRouter.use('/customers', customersRouter)
adminRouter.use('/conversations', conversationsRouter)
adminRouter.use('/kb', kbRouter)
adminRouter.use('/promotions', promotionsRouter)
adminRouter.use('/broadcast', broadcastRouter)
adminRouter.use('/scheduler', schedulerRouter)
adminRouter.use('/bot-config', botConfigRouter)
adminRouter.use('/corrections', correctionsRouter)
adminRouter.use('/test', testRouter)
adminRouter.use('/webhooks', webhooksRouter)

export const webhookRouter_ = webhookRouter
