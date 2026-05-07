import { Worker, Queue } from 'bullmq'
import { redis } from '../../redis/index.js'
import { db } from '../../db/index.js'
import { processRenewalStep } from './renewal.js'
import { processBroadcastMessage } from './broadcast.js'

export const renewalQueue = new Queue('renewal', {
  connection: redis,
  defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
})
export const broadcastQueue = new Queue('broadcast', {
  connection: redis,
  defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
})

async function pollDueRenewalJobs() {
  try {
    const { rows } = await db.query(
      `UPDATE follow_up_jobs
       SET status = 'sent', sent_at = NOW()
       WHERE id IN (
         SELECT id FROM follow_up_jobs
         WHERE status = 'pending' AND scheduled_at <= NOW()
         FOR UPDATE SKIP LOCKED
       )
       RETURNING id, customer_id, step`
    )
    for (const job of rows) {
      await renewalQueue.add('renewal_step', {
        jobId: job.id,
        customerId: job.customer_id,
        step: job.step,
      })
    }
    if (rows.length > 0) console.log(`Renewal poller: enqueued ${rows.length} jobs`)
  } catch (err) {
    console.error('Renewal poller error:', err)
  }
}

export function startWorkers() {
  new Worker('renewal', async (job) => {
    await processRenewalStep(job.data)
  }, { connection: redis })

  new Worker('broadcast', async (job) => {
    await processBroadcastMessage(job.data)
  }, {
    connection: redis,
    limiter: { max: 10, duration: 60_000 },
  })

  pollDueRenewalJobs()
  setInterval(pollDueRenewalJobs, 60_000)

  console.log('BullMQ workers started.')
}
