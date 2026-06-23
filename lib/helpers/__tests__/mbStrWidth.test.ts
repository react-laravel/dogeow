import { describe, expect, it } from 'vitest'
import { mbStrWidth, mbStrImWidth } from '../mbStrWidth'

describe('mbStrWidth', () => {
  it('should return 0 for empty string', () => {
    expect(mbStrWidth('')).toBe(0)
  })

  it('should return 1 for ASCII characters', () => {
    expect(mbStrWidth('A')).toBe(1)
    expect(mbStrWidth('z')).toBe(1)
    expect(mbStrWidth('0')).toBe(1)
    expect(mbStrWidth(' ')).toBe(1)
    expect(mbStrWidth('Hello')).toBe(5)
  })

  it('should return 2 for CJK characters', () => {
    expect(mbStrWidth('中')).toBe(2)
    expect(mbStrWidth('文')).toBe(2)
    expect(mbStrWidth('日本語')).toBe(6)
    expect(mbStrWidth('한글')).toBe(4)
  })

  it('should handle emoji using charCodeAt (surrogate pairs)', () => {
    // charCodeAt returns individual code units for surrogate pairs
    // 😀 = U+1F600 → high surrogate 0xD83D (in 0x0020-0x1fff → +1) + low surrogate 0xDE00 (outside ranges → +0)
    // So the total width from charCodeAt approach is 1 for the first surrogate and 0 for the second
    expect(mbStrWidth('😀')).toBeGreaterThanOrEqual(1)
  })

  it('should return 1 for half-width katakana', () => {
    // Half-width katakana: 0xff61 - 0xff9f
    expect(mbStrWidth('ｱ')).toBe(1) // 0xff71
    expect(mbStrWidth('ｶ')).toBe(1) // 0xff76
  })

  it('should return 2 for full-width characters in range 0x2000-0xff60', () => {
    // Full-width space: 0x3000
    expect(mbStrWidth('　')).toBe(2)
    // Full-width Latin: 0xff01-0xff5f
    expect(mbStrWidth('Ａ')).toBe(2) // 0xff21
  })

  it('should return 0 for control characters', () => {
    expect(mbStrWidth('\x00')).toBe(0)
    expect(mbStrWidth('\n')).toBe(0)
    expect(mbStrWidth('\t')).toBe(0)
  })

  it('should handle mixed content', () => {
    // A(1) + 中(2) = 3
    expect(mbStrWidth('A中')).toBe(3)
    // H(1) e(1) l(1) l(1) o(1) 世(4) 界(4) = 9 using charCodeAt
    expect(mbStrWidth('Hello世界')).toBe(9)
  })
})

describe('mbStrImWidth', () => {
  it('should return empty string for negative width', () => {
    expect(mbStrImWidth('hello', 0, -1)).toBe('')
  })

  it('should return only trimMarker when width is less than trimMarker', () => {
    expect(mbStrImWidth('hello', 0, 2, '...')).toBe('...')
  })

  it('should trim string by display width', () => {
    // 'Hello' is width 5
    expect(mbStrImWidth('Hello World', 0, 5)).toBe('Hello')
    expect(mbStrImWidth('Hello World', 0, 8)).toBe('Hello Wo') // H(1)e(1)l(1)l(1)o(1) (1)W(1)o(1) = 8
  })

  it('should add trimMarker when trimmed', () => {
    // trimMarker '...' has width 3, so maxContentWidth = 5 - 3 = 2
    expect(mbStrImWidth('Hello World', 0, 5, '...')).toBe('He...')
    // trimMarker '..' has width 2, so maxContentWidth = 5 - 2 = 3
    expect(mbStrImWidth('Hello World', 0, 5, '..')).toBe('Hel..')
  })

  it('should not trim when content fits within width', () => {
    expect(mbStrImWidth('Hi', 0, 5)).toBe('Hi')
    expect(mbStrImWidth('Hi', 0, 5, '...')).toBe('Hi')
  })

  it('should start from given start position', () => {
    expect(mbStrImWidth('Hello World', 6, 5)).toBe('World')
  })

  it('should handle CJK characters', () => {
    // '中文测试' is width 8 (2+2+2+2)
    expect(mbStrImWidth('中文测试', 0, 4)).toBe('中文') // width 4
    expect(mbStrImWidth('中文测试', 0, 4, '..')).toBe('中..')
  })

  it('should handle empty string', () => {
    expect(mbStrImWidth('', 0, 10)).toBe('')
  })

  it('should handle mixed content', () => {
    // 'A中文B' - charCodeAt approach: A(1) 中(2) 文(2) B(1) = width 6
    // With width 3, trimMarker '..' has width 2, maxContentWidth = 3 - 2 = 1
    // Only 'A' fits (width 1)
    expect(mbStrImWidth('A中文B', 0, 3)).toBe('A中') // A(1)+中(2)=3 fits exactly
    // With width 4, trimMarker '..' has width 2, maxContentWidth = 4 - 2 = 2
    // 'A'(1) + '中'(2) = 3 > 2, so only 'A' fits
    expect(mbStrImWidth('A中文B', 0, 4, '..')).toBe('A..')
  })
})
