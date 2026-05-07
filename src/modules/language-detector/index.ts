import { franc } from 'franc-min'

const ZH_REGEX = /[一-鿿㐀-䶿]/
const TA_REGEX = /[஀-௿]/
const BM_KEYWORDS = new Set([
  'ya', 'ye', 'ok', 'okay', 'tak', 'tidak', 'nak', 'boleh', 'jangan',
  'saya', 'aku', 'kamu', 'awak', 'dia', 'kami', 'kita', 'mereka',
  'dan', 'atau', 'dengan', 'untuk', 'dari', 'ke', 'di', 'yang',
  'ada', 'tiada', 'buat', 'bagi', 'lagi', 'dah', 'sudah', 'belum',
  'berapa', 'macam', 'mana', 'bila', 'kenapa', 'bagaimana', 'siapa',
  'insurans', 'roadtax', 'renew', 'bayar', 'harga', 'kereta', 'nombor',
])

type Language = 'bm' | 'zh' | 'ta' | 'en'

const FRANC_TO_LANG: Record<string, Language> = {
  zsm: 'bm', // Standard Malay
  ind: 'bm', // Indonesian — treat as BM for this context
  eng: 'en',
  cmn: 'zh',
  tam: 'ta',
}

export function detectLanguage(text: string): Language {
  if (ZH_REGEX.test(text)) return 'zh'
  if (TA_REGEX.test(text)) return 'ta'

  const words = text.toLowerCase().match(/\b\w+\b/g) ?? []
  const bmHits = words.filter(w => BM_KEYWORDS.has(w)).length
  if (bmHits > 0 && bmHits >= Math.ceil(words.length * 0.3)) return 'bm'

  const detected = franc(text, { minLength: 3 })
  return FRANC_TO_LANG[detected] ?? 'bm'
}
