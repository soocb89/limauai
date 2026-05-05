import { describe, it, expect } from 'vitest'
import { detectLanguage } from '../../src/modules/language-detector/index.js'

describe('detectLanguage', () => {
  it('detects Chinese from Chinese characters', () => {
    expect(detectLanguage('你好，我想续保')).toBe('zh')
  })

  it('detects Tamil from Tamil script', () => {
    expect(detectLanguage('வணக்கம் என் காரின் காப்பீடு புதுப்பிக்க வேண்டும்')).toBe('ta')
  })

  it('detects English', () => {
    expect(detectLanguage('I want to renew my car insurance')).toBe('en')
  })

  it('detects Bahasa Malaysia', () => {
    expect(detectLanguage('Saya nak renew insurans kereta saya')).toBe('bm')
  })

  it('returns bm for very short ambiguous text', () => {
    expect(detectLanguage('ok')).toBe('bm')
  })
})
