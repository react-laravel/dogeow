import { describe, it, expect } from 'vitest'
import {
  isSupportedLanguage,
  getSupportedLanguagesByPrefix,
  normalizeLanguageCode,
  detectLanguageFromBrowser,
} from '../browser-language-utils'

// Mock the translations module (browser-language-utils imports SUPPORTED_LANGUAGES from it)
vi.mock('../translations', () => ({
  SUPPORTED_LANGUAGES: [
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  ],
}))

describe('browser-language-utils', () => {
  describe('isSupportedLanguage', () => {
    it('should return true for supported languages', () => {
      expect(isSupportedLanguage('zh-CN')).toBe(true)
      expect(isSupportedLanguage('zh-TW')).toBe(true)
      expect(isSupportedLanguage('en')).toBe(true)
      expect(isSupportedLanguage('ja')).toBe(true)
    })

    it('should return false for unsupported languages', () => {
      expect(isSupportedLanguage('fr')).toBe(false)
      expect(isSupportedLanguage('de')).toBe(false)
      expect(isSupportedLanguage('ko')).toBe(false)
      expect(isSupportedLanguage('')).toBe(false)
    })
  })

  describe('getSupportedLanguagesByPrefix', () => {
    it('should return matching language for known prefix', () => {
      const result = getSupportedLanguagesByPrefix('zh')
      expect(result).toHaveLength(1)
      expect(result[0].code).toBe('zh-CN')
    })

    it('should return matching language for en prefix', () => {
      const result = getSupportedLanguagesByPrefix('en')
      expect(result).toHaveLength(1)
      expect(result[0].code).toBe('en')
    })

    it('should return matching language for ja prefix', () => {
      const result = getSupportedLanguagesByPrefix('ja')
      expect(result).toHaveLength(1)
      expect(result[0].code).toBe('ja')
    })

    it('should be case-insensitive', () => {
      const result = getSupportedLanguagesByPrefix('ZH')
      expect(result).toHaveLength(1)
      expect(result[0].code).toBe('zh-CN')
    })

    it('should return empty array for unknown prefix', () => {
      expect(getSupportedLanguagesByPrefix('fr')).toEqual([])
      expect(getSupportedLanguagesByPrefix('unknown')).toEqual([])
    })

    it('should return empty array for empty prefix', () => {
      expect(getSupportedLanguagesByPrefix('')).toEqual([])
    })
  })

  describe('normalizeLanguageCode', () => {
    it('should return exact match for supported language', () => {
      expect(normalizeLanguageCode('zh-CN')).toBe('zh-CN')
      expect(normalizeLanguageCode('en')).toBe('en')
      expect(normalizeLanguageCode('ja')).toBe('ja')
      expect(normalizeLanguageCode('zh-TW')).toBe('zh-TW')
    })

    it('should normalize zh-CN style codes', () => {
      expect(normalizeLanguageCode('zh-CN')).toBe('zh-CN')
    })

    it('should handle underscore variant', () => {
      // zh_CN -> zh-CN via prefix mapping
      expect(normalizeLanguageCode('zh_CN')).toBe('zh-CN')
    })

    it('should handle prefix-only codes', () => {
      expect(normalizeLanguageCode('zh')).toBe('zh-CN')
      expect(normalizeLanguageCode('en')).toBe('en')
      expect(normalizeLanguageCode('ja')).toBe('ja')
    })

    it('should return null for unsupported codes', () => {
      expect(normalizeLanguageCode('fr')).toBeNull()
      expect(normalizeLanguageCode('de')).toBeNull()
      expect(normalizeLanguageCode('unknown')).toBeNull()
    })
  })

  describe('detectLanguageFromBrowser', () => {
    it('should return exact match with high confidence', () => {
      const result = detectLanguageFromBrowser(['en'])
      expect(result).toEqual({ language: 'en', confidence: 0.95 })
    })

    it('should return exact match with region', () => {
      const result = detectLanguageFromBrowser(['zh-CN'])
      expect(result).toEqual({ language: 'zh-CN', confidence: 0.95 })
    })

    it('should match by prefix with 0.8 confidence', () => {
      const result = detectLanguageFromBrowser(['zh-HK'])
      expect(result).not.toBeNull()
      expect(result?.language).toBe('zh-CN')
      expect(result?.confidence).toBe(0.8)
    })

    it('should match prefix with region at higher confidence', () => {
      const result = detectLanguageFromBrowser(['zh-CN'])
      expect(result?.confidence).toBe(0.95)
    })

    it('should return first match from browser language list', () => {
      const result = detectLanguageFromBrowser(['fr', 'zh-CN', 'en'])
      expect(result?.language).toBe('zh-CN')
    })

    it('should return null for no match', () => {
      const result = detectLanguageFromBrowser(['fr', 'de', 'ko'])
      expect(result).toBeNull()
    })

    it('should return null for empty array', () => {
      const result = detectLanguageFromBrowser([])
      expect(result).toBeNull()
    })
  })
})
