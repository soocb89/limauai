import OpenAI from 'openai'
import { config } from '../../config.js'

const openai = new OpenAI({ apiKey: config.openai.apiKey })

export async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}
