import type { KBChunk } from '../kb-retriever/index.js'

interface BotConfig {
  tone: string
  persona_name: string
  language_fallback: string
}

interface Correction {
  corrected_reply: string
  intent: string
}

export function buildSystemPrompt(
  botConfig: BotConfig,
  kbChunks: KBChunk[],
  corrections: Correction[],
  language: string,
  intent: string
): string {
  const toneInstructions: Record<string, string> = {
    formal: 'Use formal, professional language. Address customer respectfully.',
    friendly: 'Use warm, friendly language. Be helpful and approachable.',
    casual: 'Use casual, conversational language. Keep it light and easy.',
  }

  const langInstructions: Record<string, string> = {
    bm: 'Reply in Bahasa Malaysia.',
    zh: 'Reply in Mandarin Chinese (Simplified).',
    ta: 'Reply in Tamil.',
    en: 'Reply in English.',
  }

  const kbSection = kbChunks.length > 0
    ? `\n\nKnowledge Base Context:\n${kbChunks.map(c => `### ${c.title}\n${c.content}`).join('\n\n')}`
    : ''

  const correctionsSection = corrections.length > 0
    ? `\n\nExamples of correct replies for intent "${intent}":\n${corrections.map(c => `- ${c.corrected_reply}`).join('\n')}`
    : ''

  return `You are ${botConfig.persona_name}, a helpful assistant for a Malaysian car insurance and roadtax renewal company.
${toneInstructions[botConfig.tone] ?? toneInstructions.friendly}
${langInstructions[language] ?? langInstructions[botConfig.language_fallback] ?? langInstructions.bm}
Keep replies concise (under 150 words). Do not make up information not in the knowledge base.${kbSection}${correctionsSection}`
}
