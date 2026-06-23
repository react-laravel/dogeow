import { describe, expect, it } from 'vitest'
import { belowMinLength, calculateCharLength, exceedsMaxLength } from '../charLength'

describe('charLength', () => {
  describe('calculateCharLength', () => {
    it('should return 0 for empty string', () => {
      expect(calculateCharLength('')).toBe(0)
    })

    it('should return 1 for ASCII characters', () => {
      expect(calculateCharLength('A')).toBe(1)
      expect(calculateCharLength('z')).toBe(1)
      expect(calculateCharLength('0')).toBe(1)
      expect(calculateCharLength(' ')).toBe(1)
      expect(calculateCharLength('Hello')).toBe(5)
    })

    it('should return 2 for CJK characters', () => {
      expect(calculateCharLength('中')).toBe(2)
      expect(calculateCharLength('文')).toBe(2)
      expect(calculateCharLength('日本語')).toBe(6)
      // Note: Korean Hangul (한글) uses different Unicode range (0xAC00-0xD7A3)
      // and is not in the CJK range checked by calculateCharLength, so it counts as 1 each
      expect(calculateCharLength('한')).toBe(1)
      expect(calculateCharLength('글')).toBe(1)
    })

    it('should return 2 for emoji', () => {
      expect(calculateCharLength('😀')).toBe(2)
      expect(calculateCharLength('🎉')).toBe(2)
      expect(calculateCharLength('👍')).toBe(2)
    })

    it('should return 2 for regional indicator symbols (flags)', () => {
      // 🇨🇳 = U+1F1E8 U+1F1F3 (two surrogate pairs)
      // Each regional indicator has codePoint in 0x1F1E6-0x1F1FF range → counts as 2
      expect(calculateCharLength('🇨🇳')).toBe(4) // 2 + 2 = 4
    })

    it('should handle mixed content', () => {
      // A(1) + 中(2) = 3
      expect(calculateCharLength('A中')).toBe(3)
      // H(1) e(1) l(1) l(1) o(1) 世(2) 界(2) = 9
      expect(calculateCharLength('Hello世界')).toBe(9)
    })

    it('should handle CJK Extension A', () => {
      // U+3400 is in CJK Extension A range
      const char = '㐀'
      expect(calculateCharLength(char)).toBe(2)
    })

    it('should handle misc symbols', () => {
      // ☀ = U+2600 (misc symbols range)
      expect(calculateCharLength('☀')).toBe(2)
    })

    it('should handle numbers in mixed text', () => {
      // 1(1) 2(1) 3(1) 中(2) = 5
      expect(calculateCharLength('123中')).toBe(5)
    })

    it('should handle newline as ASCII', () => {
      expect(calculateCharLength('\n')).toBe(1)
    })

    it('should handle tab as ASCII', () => {
      expect(calculateCharLength('\t')).toBe(1)
    })
  })

  describe('exceedsMaxLength', () => {
    it('should return true when text exceeds max length', () => {
      expect(exceedsMaxLength('Hello世界', 4)).toBe(true)
      // Hello(5) + 世(2) = 7 > 5
      expect(exceedsMaxLength('Hello世界', 5)).toBe(true)
    })

    it('should return false when text is within max length', () => {
      expect(exceedsMaxLength('Hello', 5)).toBe(false)
      expect(exceedsMaxLength('Hello', 10)).toBe(false)
      expect(exceedsMaxLength('', 5)).toBe(false)
    })

    it('should return true when text equals max length + 1', () => {
      expect(exceedsMaxLength('Hello', 4)).toBe(true)
    })

    it('should return false when text equals max length', () => {
      expect(exceedsMaxLength('Hello', 5)).toBe(false)
    })
  })

  describe('belowMinLength', () => {
    it('should return true when text is below min length', () => {
      expect(belowMinLength('Hi', 5)).toBe(true)
      expect(belowMinLength('', 1)).toBe(true)
    })

    it('should return false when text meets min length', () => {
      expect(belowMinLength('Hello', 5)).toBe(false)
      expect(belowMinLength('Hello', 3)).toBe(false)
    })

    it('should return false when text exceeds min length', () => {
      expect(belowMinLength('Hello World', 5)).toBe(false)
    })

    it('should handle CJK characters correctly', () => {
      // 中文 = 4 chars, min 3 → false
      expect(belowMinLength('中文', 3)).toBe(false)
      // 中文 = 4 chars, min 5 → true
      expect(belowMinLength('中文', 5)).toBe(true)
    })
  })
})
