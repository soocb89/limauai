import { Router } from 'express'
import multer from 'multer'
import { read, utils } from 'xlsx'
import { db } from '../../../db/index.js'
import { scheduleRenewalJobs } from '../../scheduler/seed-renewal-jobs.js'

export const customersRouter = Router()
const upload = multer({ storage: multer.memoryStorage() })

customersRouter.get('/', async (req, res) => {
  const { search, language, insurer } = req.query
  let sql = `SELECT id, phone, name, email, language, renewal_date, car_plate, insurer,
                    consent, source, created_at
             FROM customers WHERE 1=1`
  const params: unknown[] = []

  if (search) {
    params.push(`%${search}%`)
    sql += ` AND (phone ILIKE $${params.length} OR name ILIKE $${params.length})`
  }
  if (language) {
    params.push(language)
    sql += ` AND language = $${params.length}`
  }
  if (insurer) {
    params.push(insurer)
    sql += ` AND insurer = $${params.length}`
  }

  sql += ' ORDER BY created_at DESC LIMIT 100'
  const { rows } = await db.query(sql, params)
  res.json(rows)
})

customersRouter.get('/:id', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM customers WHERE id = $1', [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'Not found' })
  res.json(rows[0])
})

customersRouter.post('/', async (req, res) => {
  const { phone, name, email, language, renewal_date, car_plate, insurer, senang_customer_id } = req.body
  const { rows } = await db.query(
    `INSERT INTO customers (phone, name, email, language, renewal_date, car_plate, insurer, senang_customer_id, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'excel_import') RETURNING *`,
    [phone, name, email, language, renewal_date, car_plate, insurer, senang_customer_id]
  )
  if (rows[0].renewal_date) {
    await scheduleRenewalJobs(rows[0].id, new Date(rows[0].renewal_date))
  }
  res.status(201).json(rows[0])
})

customersRouter.put('/:id', async (req, res) => {
  const { name, email, language, renewal_date, car_plate, insurer, senang_customer_id, consent } = req.body
  const { rows } = await db.query(
    `UPDATE customers SET name=$1, email=$2, language=$3, renewal_date=$4,
     car_plate=$5, insurer=$6, senang_customer_id=$7, consent=$8,
     consent_given_at = CASE WHEN $8 = true AND consent = false THEN NOW() ELSE consent_given_at END,
     updated_at=NOW()
     WHERE id=$9 RETURNING *`,
    [name, email, language, renewal_date, car_plate, insurer, senang_customer_id, consent, req.params.id]
  )
  if (!rows[0]) return res.status(404).json({ error: 'Not found' })
  res.json(rows[0])
})

customersRouter.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  const workbook = read(req.file.buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, unknown>[] = utils.sheet_to_json(sheet)

  let imported = 0
  let errors = 0

  for (const row of rows) {
    try {
      const phone = String(row['phone'] ?? row['Phone'] ?? '').replace(/\D/g, '')
      if (!phone) { errors++; continue }

      const renewalDate = row['renewal_date'] ?? row['Renewal Date'] ?? null
      const { rows: inserted } = await db.query(
        `INSERT INTO customers (phone, name, email, language, renewal_date, car_plate, insurer, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'excel_import')
         ON CONFLICT (phone) DO UPDATE SET
           name=EXCLUDED.name, renewal_date=EXCLUDED.renewal_date,
           car_plate=EXCLUDED.car_plate, insurer=EXCLUDED.insurer,
           updated_at=NOW()
         RETURNING id, renewal_date`,
        [
          phone,
          row['name'] ?? row['Name'] ?? null,
          row['email'] ?? row['Email'] ?? null,
          row['language'] ?? row['Language'] ?? null,
          renewalDate ?? null,
          row['car_plate'] ?? row['Car Plate'] ?? null,
          row['insurer'] ?? row['Insurer'] ?? null,
        ]
      )

      if (inserted[0]?.renewal_date) {
        await scheduleRenewalJobs(inserted[0].id, new Date(inserted[0].renewal_date))
      }
      imported++
    } catch {
      errors++
    }
  }

  res.json({ imported, errors, total: rows.length })
})
