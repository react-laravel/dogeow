import { describe, it, expect } from 'vitest'
import { getLanguageFlag, getSupportedLanguageCodes, hasLanguageFlag } from '../languageFlags'

describe('languageFlags', () => {
  describe('getLanguageFlag', () => {
    it('应该返回正确的国旗 emoji', () => {
      expect(getLanguageFlag('zh-CN')).toBe('🇨🇳')
      expect(getLanguageFlag('zh-TW')).toBe('🌐')
      expect(getLanguageFlag('en')).toBe('🇺🇸')
      expect(getLanguageFlag('ja')).toBe('🌐')
    })

    it('应该返回默认 emoji 对于不支持的语言', () => {
      expect(getLanguageFlag('fr')).toBe('🌐')
      expect(getLanguageFlag('de')).toBe('🌐')
      expect(getLanguageFlag('unknown')).toBe('🌐')
    })

    it('应该返回默认 emoji 对于空值或未定义', () => {
      expect(getLanguageFlag('')).toBe('🌐')
      expect(getLanguageFlag(undefined)).toBe('🌐')
      expect(getLanguageFlag(null as unknown as string)).toBe('🌐')
    })
  })

  describe('getSupportedLanguageCodes', () => {
    it('应该返回所有支持的语言代码', () => {
      const codes = getSupportedLanguageCodes()
      expect(codes).toContain('zh-CN')
      expect(codes).not.toContain('zh-TW')
      expect(codes).toContain('en')
      expect(codes).not.toContain('ja')
      expect(codes).toHaveLength(2)
    })
  })

  describe('hasLanguageFlag', () => {
    it('应该正确识别支持的语言', () => {
      expect(hasLanguageFlag('zh-CN')).toBe(true)
      expect(hasLanguageFlag('zh-TW')).toBe(false)
      expect(hasLanguageFlag('en')).toBe(true)
      expect(hasLanguageFlag('ja')).toBe(false)
    })

    it('应该正确识别不支持的语言', () => {
      expect(hasLanguageFlag('fr')).toBe(false)
      expect(hasLanguageFlag('de')).toBe(false)
      expect(hasLanguageFlag('unknown')).toBe(false)
      expect(hasLanguageFlag('constructor')).toBe(false)
      expect(getLanguageFlag('__proto__')).toBe('🌐')
      expect(hasLanguageFlag('')).toBe(false)
    })
  })
})
