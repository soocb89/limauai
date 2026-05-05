import { Router } from 'express'
import multer from 'multer'
import { db } from '../../../db/index.js'
import { addKBEntry } from '../../kb-retriever/index.js'
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

kbRouter.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM knowledge_base WHERE id = $1', [req.params.id])
  res.json({ deleted: true })
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
  } else {
    return res.status(400).json({ error: 'Only PDF and DOCX supported' })
  }

  const chunks = chunkText(text, 500)
  const title = req.body.title ?? req.file.originalname
  let count = 0
  for (const chunk of chunks) {
    await addKBEntry({ title: `${title} (${count + 1})`, content: chunk, category: req.body.category })
    count++
  }

  res.json({ chunks: count })
})

kbRouter.get('/gaps', async (_req, res) => {
  const { rows } = await db.query(`
    SELECT intent,
           AVG(confidence) AS avg_confidence,
           COUNT(*) AS count
    FROM messages
    WHERE role = 'user'
      AND intent IS NOT NULL
      AND confidence < 0.6
    GROUP BY intent
    ORDER BY avg_confidence ASC
    LIMIT 20
  `)
  res.json(rows)
})

function chunkText(text: string, maxWords: number): string[] {
  const sentences = text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/)
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
