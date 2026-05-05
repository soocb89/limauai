import { db } from '../../db/index.js'

export async function scheduleRenewalJobs(customerId: string, renewalDate: Date): Promise<void> {
  const steps: Array<{ step: string; daysOffset: number }> = [
    { step: 't30', daysOffset: -30 },
    { step: 't14', daysOffset: -14 },
    { step: 't3', daysOffset: -3 },
    { step: 't1', daysOffset: 1 },
  ]

  for (const { step, daysOffset } of steps) {
    const scheduledAt = new Date(renewalDate)
    scheduledAt.setDate(scheduledAt.getDate() + daysOffset)

    if (scheduledAt <= new Date()) continue

    await db.query(
      `INSERT INTO follow_up_jobs (customer_id, type, step, scheduled_at)
       VALUES ($1, 'renewal_reminder', $2, $3)
       ON CONFLICT DO NOTHING`,
      [customerId, step, scheduledAt]
    )
  }
}
