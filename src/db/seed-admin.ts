import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { db } from './index.js'

const username = process.env.ADMIN_USERNAME ?? 'admin'
const password = process.env.ADMIN_API_KEY
if (!password) { console.error('ADMIN_API_KEY required'); process.exit(1) }

const hash = await bcrypt.hash(password, 10)
await db.query(
  `INSERT INTO admin_users (username, password_hash, role)
   VALUES ($1, $2, 'admin')
   ON CONFLICT (username) DO NOTHING`,
  [username, hash]
)
console.log(`Admin user "${username}" seeded.`)
process.exit(0)
