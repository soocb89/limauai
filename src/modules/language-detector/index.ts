import { franc } from 'franc-min'

const ZH_REGEX = /[一-鿿㐀-䶿]/
const TA_REGEX = /[஀-௿]/

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

  const detected = franc(text, { minLength: 3 })
  return FRANC_TO_LANG[detected] ?? 'bm' // default to BM (primary language)
}
