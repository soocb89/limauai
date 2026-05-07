import { Router } from 'express'
import QRCode from 'qrcode'
import { getWAStatus, getWAQR } from '../../wa-connector/status.js'

export const waStatusRouter = Router()

waStatusRouter.get('/', async (_req, res) => {
  const status = getWAStatus()
  const qrString = getWAQR()

  let qr_data_url: string | null = null
  if (qrString) {
    qr_data_url = await QRCode.toDataURL(qrString, { width: 300, margin: 2 })
  }

  res.json({ status, qr_data_url })
})
