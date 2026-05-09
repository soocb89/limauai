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

const EN_KEYWORDS = new Set([
  'the', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'can', 'may', 'might', 'shall',
  'i', 'you', 'he', 'she', 'we', 'they', 'my', 'your', 'our', 'their',
  'this', 'that', 'these', 'those', 'what', 'which', 'who', 'how', 'when', 'where', 'why',
  'and', 'or', 'but', 'not', 'no', 'yes', 'if', 'then', 'with', 'for', 'from', 'about',
  'insurance', 'insurer', 'renewal', 'renew', 'car', 'vehicle', 'plate', 'price', 'cost',
  'quote', 'policy', 'partner', 'provide', 'offer', 'service', 'want', 'need', 'get',
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

  const enHits = words.filter(w => EN_KEYWORDS.has(w)).length
  if (enHits > 0 && enHits >= Math.ceil(words.length * 0.3)) return 'en'

  const detected = franc(text, { minLength: 3 })
  if (detected in FRANC_TO_LANG) return FRANC_TO_LANG[detected]

  // franc undetermined — do a lighter pass: any EN keyword = en, else bm
  if (enHits > 0) return 'en'
  return 'bm'
}
