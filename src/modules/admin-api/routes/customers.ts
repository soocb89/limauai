import { Router } from 'express'
import multer from 'multer'
import { read, utils } from 'xlsx'
import { db } from '../../../db/index.js'
import { scheduleRenewalJobs } from '../../scheduler/seed-renewal-jobs.js'

export const customersRouter = Router()
const upload = multer({ storage: multer.memoryStorage() })

customersRouter.get('/', async (req, res) => {
  const { search, language, insurer, page, limit: limitParam } = req.query
  const limit = Math.min(parseInt(String(limitParam ?? '50'), 10) || 50, 200)
  const offset = (Math.max(parseInt(String(page ?? '1'), 10) || 1, 1) - 1) * limit
  const pageNum = Math.floor(offset / limit) + 1

  let where = 'WHERE 1=1'
  const params: unknown[] = []

  if (search) {
    params.push(`%${search}%`)
    where += ` AND (phone ILIKE $${params.length} OR name ILIKE $${params.length})`
  }
  if (language) {
    params.push(language)
    where += ` AND language = $${params.length}`
  }
  if (insurer) {
    params.push(insurer)
    where += ` AND insurer = $${params.length}`
  }

  const countSql = `SELECT COUNT(*)::int AS total FROM customers ${where}`
  const dataSql = `SELECT id, phone, name, email, language, renewal_date, car_plate, insurer,
                          consent, source, tags, custom_fields, created_at
                   FROM customers ${where}
                   ORDER BY created_at DESC
                   LIMIT ${limit} OFFSET ${offset}`

  const [{ rows: countRows }, { rows }] = await Promise.all([
    db.query(countSql, params),
    db.query(dataSql, params),
  ])

  res.json({ data: rows, total: countRows[0].total, page: pageNum, limit })
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
  const { name, email, language, renewal_date, car_plate, insurer, senang_customer_id, consent, tags, custom_fields } = req.body
  const { rows } = await db.query(
    `UPDATE customers SET name=$1, email=$2, language=$3, renewal_date=$4,
     car_plate=$5, insurer=$6, senang_customer_id=$7, consent=$8,
     consent_given_at = CASE WHEN $8 = true AND consent = false THEN NOW() ELSE consent_given_at END,
     tags=COALESCE($9, tags), custom_fields=COALESCE($10, custom_fields),
     updated_at=NOW()
     WHERE id=$11 RETURNING *`,
    [name, email, language, renewal_date, car_plate, insurer, senang_customer_id, consent,
     tags ?? null, custom_fields ? JSON.stringify(custom_fields) : null, req.params.id]
  )
  if (!rows[0]) return res.status(404).json({ error: 'Not found' })
  res.json(rows[0])
})

customersRouter.patch('/:id', async (req, res) => {
  const allowed = ['name', 'email', 'language', 'renewal_date', 'car_plate', 'insurer', 'consent', 'tags', 'custom_fields']
  const updates: string[] = []
  const params: unknown[] = []
  for (const key of allowed) {
    if (key in req.body) {
      params.push(key === 'custom_fields' ? JSON.stringify(req.body[key]) : req.body[key])
      updates.push(`${key} = $${params.length}`)
    }
  }
  if (!updates.length) return res.status(400).json({ error: 'No valid fields' })
  params.push(req.params.id)
  const { rows } = await db.query(
    `UPDATE customers SET ${updates.join(', ')}, updated_at=NOW() WHERE id=$${params.length} RETURNING *`,
    params
  )
  if (!rows[0]) return res.status(404).json({ error: 'Not found' })
  res.json(rows[0])
})

customersRouter.delete('/:id', async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM customers WHERE id = $1', [req.params.id])
  if (!rowCount) return res.status(404).json({ error: 'Not found' })
  res.json({ deleted: true })
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
