import 'dotenv/config'

function required(key: string): string {
  const val = process.env[key]
  if (val === undefined || val === '') throw new Error(`Missing required env var: ${key}`)
  return val
}

export const config = {
  db: { url: required('DATABASE_URL') },
  redis: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
  openai: { apiKey: required('OPENAI_API_KEY') },
  admin: { apiKey: required('ADMIN_API_KEY') },
  owner: { phone: required('OWNER_PHONE') },
  baileys: { sessionPath: process.env.BAILEYS_SESSION_PATH ?? './baileys-session' },
  port: (() => { const p = parseInt(process.env.PORT ?? '3000', 10); return Number.isFinite(p) ? p : 3000 })(),
} as const
