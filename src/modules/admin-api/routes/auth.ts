import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { db } from '../../../db/index.js'
import { requireApiKey } from '../middleware/auth.js'

export const authRouter = Router()

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' })
  }

  const { rows } = await db.query(
    'SELECT id, password_hash, role FROM admin_users WHERE username = $1',
    [username]
  )
  const user = rows[0]
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const secret = process.env.SESSION_SECRET
  if (!secret) return res.status(500).json({ error: 'SESSION_SECRET not configured' })

  const token = jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '7d' })
  res.json({ token, role: user.role })
})

// Create a new agent user — requires admin API key
authRouter.post('/users', requireApiKey, async (req, res) => {
  const { username, password, role = 'agent' } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' })
  }
  if (!['admin', 'agent'].includes(role)) {
    return res.status(400).json({ error: 'role must be admin or agent' })
  }
  const hash = await bcrypt.hash(password, 10)
  const { rows } = await db.query(
    `INSERT INTO admin_users (username, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING id, username, role, created_at`,
    [username, hash, role]
  )
  res.json(rows[0])
})
