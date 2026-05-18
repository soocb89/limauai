import { db } from '../../db/index.js'
import { embedText } from './embedder.js'

export interface KBChunk {
  id: string
  title: string
  content: string
}

export async function retrieveKB(query: string, topK = 3): Promise<KBChunk[]> {
  const embedding = await embedText(query)
  const embeddingLiteral = `[${embedding.join(',')}]`

  const { rows } = await db.query<KBChunk>(
    `SELECT id, title, content
     FROM knowledge_base
     WHERE embedding <=> $1::vector < 0.5
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [embeddingLiteral, topK]
  )

  return rows
}

export async function addKBEntry(params: {
  title: string
  content: string
  category?: string
}): Promise<string> {
  return addKBEntryWithSource({ ...params, source_document: null })
}

export async function addKBEntryWithSource(params: {
  title: string
  content: string
  category?: string
  source_document: string | null
}): Promise<string> {
  const embedding = await embedText(`${params.title}\n${params.content}`)
  const embeddingLiteral = `[${embedding.join(',')}]`

  const { rows } = await db.query(
    `INSERT INTO knowledge_base (title, content, embedding, category, source_document)
     VALUES ($1, $2, $3::vector, $4, $5)
     RETURNING id`,
    [params.title, params.content, embeddingLiteral, params.category ?? null, params.source_document]
  )
  return rows[0].id
}
