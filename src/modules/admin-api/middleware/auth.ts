import type { Request, Response, NextFunction } from 'express'
import { config } from '../../../config.js'

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-api-key']
  if (key !== config.admin.apiKey) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}
