import { Router } from 'express'
import multer from 'multer'
import { read, utils } from 'xlsx'
import { db } from '../../../db/index.js'
import { addKBEntry, addKBEntryWithSource } from '../../kb-retriever/index.js'
import { embedText } from '../../kb-retriever/embedder.js'

export const kbRouter = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

kbRouter.get('/', async (_req, res) => {
  const { rows } = await db.query(
    'SELECT id, title, content, category, created_at FROM knowledge_base ORDER BY created_at DESC'
  )
  res.json(rows)
})

kbRouter.post('/', async (req, res) => {
  const { title, content, category } = req.body
  const id = await addKBEntry({ title, content, category })
  res.status(201).json({ id })
})

kbRouter.put('/:id', async (req, res) => {
  const { title, content, category } = req.body
  const embedding = await embedText(`${title}\n${content}`)
  const embeddingLiteral = `[${embedding.join(',')}]`

  const { rows } = await db.query(
    `UPDATE knowledge_base SET title=$1, content=$2, embedding=$3::vector, category=$4, updated_at=NOW()
     WHERE id=$5 RETURNING id`,
    [title, content, embeddingLiteral, category, req.params.id]
  )
  if (!rows[0]) return res.status(404).json({ error: 'Not found' })
  res.json({ updated: true })
})

kbRouter.delete('/all', async (_req, res) => {
  const { rowCount } = await db.query('DELETE FROM knowledge_base')
  res.json({ deleted: rowCount })
})

kbRouter.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM knowledge_base WHERE id = $1', [req.params.id])
  res.json({ deleted: true })
})

// List distinct source documents
kbRouter.get('/sources', async (_req, res) => {
  const { rows } = await db.query(
    `SELECT source_document, COUNT(*)::int AS chunks, MIN(created_at) AS uploaded_at
     FROM knowledge_base
     WHERE source_document IS NOT NULL
     GROUP BY source_document
     ORDER BY uploaded_at DESC`
  )
  res.json(rows)
})

// Delete all chunks from a source document
kbRouter.delete('/sources/:name', async (req, res) => {
  const { rowCount } = await db.query(
    'DELETE FROM knowledge_base WHERE source_document = $1',
    [req.params.name]
  )
  res.json({ deleted: rowCount })
})

kbRouter.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })

  let text = ''
  if (req.file.mimetype === 'application/pdf') {
    const pdfParseModule = await import('pdf-parse')
    const pdfParse = (pdfParseModule as any).default ?? pdfParseModule
    const data = await pdfParse(req.file.buffer)
    text = data.text
  } else if (req.file.mimetype.includes('word') || req.file.originalname.endsWith('.docx')) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer: req.file.buffer })
    text = result.value
  } else if (req.file.mimetype === 'text/plain' || req.file.originalname.endsWith('.txt')) {
    text = req.file.buffer.toString('utf-8')
  } else if (
    req.file.originalname.endsWith('.csv') ||
    req.file.originalname.endsWith('.xlsx') ||
    req.file.originalname.endsWith('.xls') ||
    req.file.mimetype.includes('spreadsheet') ||
    req.file.mimetype === 'text/csv'
  ) {
    // Structured import: each row becomes one KB entry (no chunking)
    const wb = read(req.file.buffer, { type: 'buffer' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = utils.sheet_to_json<Record<string, string>>(sheet)
    if (!rows.length) return res.status(400).json({ error: 'Spreadsheet is empty' })

    const sourceDoc = req.file.originalname
    let count = 0
    let errors = 0

    // Parse all valid rows first, then embed in parallel batches of 10
    type KBPayload = { title: string; content: string; category: string | undefined; source_document: string }
    const payloads: KBPayload[] = []

    for (const row of rows) {
      const status = String(row.status ?? '').trim()
      if (status === 'internal_only_do_not_publish') continue

      const rawTitle = row.customer_utterances ?? row.title ?? row.question ?? row.q ??
                       row.Title ?? row.Question ?? ''
      const rawContent = row.agent_response ?? row.content ?? row.answer ?? row.a ??
                         row.Content ?? row.Answer ?? ''
      const title = String(rawTitle).trim()
      let content = String(rawContent).trim()

      const code = row.code ? String(row.code).trim() : null
      const trigger = row.customer_utterances ? String(row.customer_utterances).trim() : null
      const agentAction = row.agent_action ? String(row.agent_action).trim() : null
      if (code && trigger) {
        content = `Error code: ${code}\nCustomer sees: ${trigger}\nResponse: ${content}${agentAction ? `\nAgent action: ${agentAction}` : ''}`
      }

      const variants = row.answer_variants ? String(row.answer_variants).trim() : ''
      if (variants) content = `${content}\n\nAlternate responses:\n${variants}`

      const category = String(row.category ?? row.Category ?? req.body.category ?? '').trim() || undefined

      if (!title || !content) { errors++; continue }
      payloads.push({ title, content, category, source_document: sourceDoc })
    }

    // Embed and insert in parallel batches of 10
    const BATCH = 10
    for (let i = 0; i < payloads.length; i += BATCH) {
      const batch = payloads.slice(i, i + BATCH)
      const results = await Promise.allSettled(batch.map(p => addKBEntryWithSource(p)))
      for (const r of results) {
        if (r.status === 'fulfilled') count++
        else errors++
      }
    }

    return res.json({ chunks: count, errors, source_document: sourceDoc })
  } else {
    return res.status(400).json({ error: 'Supported: PDF, DOCX, TXT, CSV, XLSX' })
  }

  const chunks = chunkFAQ(text)
  const title = req.body.title ?? req.file.originalname
  const sourceDoc = req.file.originalname
  let count = 0
  for (const chunk of chunks) {
    await addKBEntryWithSource({ title: `${title} (${count + 1})`, content: chunk, category: req.body.category, source_document: sourceDoc })
    count++
  }

  res.json({ chunks: count, source_document: sourceDoc })
})

kbRouter.get('/gaps', async (_req, res) => {
  const { rows } = await db.query(`
    SELECT m.intent,
           AVG(m.confidence) AS avg_confidence,
           COUNT(DISTINCT c.id) AS handoff_count
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE m.role = 'user'
      AND m.intent IS NOT NULL
      AND m.intent NOT IN ('complaint', 'escalation')
      AND m.confidence < 0.6
      AND c.status = 'handoff'
    GROUP BY m.intent
    HAVING COUNT(DISTINCT c.id) >= 5
    ORDER BY avg_confidence ASC
    LIMIT 20
  `)
  res.json(rows)
})

function chunkFAQ(text: string): string[] {
  const clean = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Detect FAQ pattern: lines starting with Q: / A: or numbered Q1. / Q1)
  const faqPattern = /^(?:Q\s*[:.)]\s*|Q\d+\s*[:.)]\s*|\d+\s*[.)]\s*(?=\S))/im
  if (faqPattern.test(clean)) {
    // Split on question markers, keep Q+A pairs together
    const pairs = clean.split(/\n(?=Q\s*[:.)]\s*|Q\d+\s*[:.)]\s*|\d+\s*[.)]\s*\S)/i).filter(s => s.trim())
    const chunks: string[] = []
    let current = ''
    for (const pair of pairs) {
      if ((current + '\n' + pair).split(/\s+/).length > 400) {
        if (current.trim()) chunks.push(current.trim())
        current = pair
      } else {
        current = current ? current + '\n\n' + pair : pair
      }
    }
    if (current.trim()) chunks.push(current.trim())
    return chunks.length > 0 ? chunks : chunkText(clean, 400)
  }

  // Detect section headers (ALL CAPS lines or lines ending with :)
  const sectionPattern = /\n(?=[A-Z][A-Z\s]{5,}\n|.{3,50}:\n)/
  if (sectionPattern.test(clean)) {
    const sections = clean.split(sectionPattern).filter(s => s.trim())
    const chunks: string[] = []
    let current = ''
    for (const section of sections) {
      if ((current + '\n' + section).split(/\s+/).length > 450) {
        if (current.trim()) chunks.push(current.trim())
        current = section
      } else {
        current = current ? current + '\n\n' + section : section
      }
    }
    if (current.trim()) chunks.push(current.trim())
    return chunks.length > 0 ? chunks : chunkText(clean, 400)
  }

  return chunkText(clean, 400)
}

function chunkText(text: string, maxWords: number): string[] {
  const sentences = text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).filter(Boolean)
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if ((current + ' ' + sentence).split(' ').length > maxWords) {
      if (current) chunks.push(current.trim())
      current = sentence
    } else {
      current += ' ' + sentence
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}
