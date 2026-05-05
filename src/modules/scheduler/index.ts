import { Worker, Queue } from 'bullmq'
import { redis } from '../../redis/index.js'
import { processRenewalStep } from './renewal.js'
import { processBroadcastMessage } from './broadcast.js'

export const renewalQueue = new Queue('renewal', { connection: redis })
export const broadcastQueue = new Queue('broadcast', {
  connection: redis,
  defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
})

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

  console.log('BullMQ workers started.')
}
