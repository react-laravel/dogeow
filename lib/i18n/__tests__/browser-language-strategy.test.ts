import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserLanguageStrategy } from '../strategies/BrowserLanguageStrategy'

describe('BrowserLanguageStrategy', () => {
  let strategy: BrowserLanguageStrategy

  beforeEach(() => {
    strategy = new BrowserLanguageStrategy()
    vi.clearAllMocks()
    vi.stubGlobal('window', {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const stubNavigator = (navigator: Partial<Navigator>) => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('navigator', navigator)
  }

  describe('detect', () => {
    it('should return null in non-browser environment', () => {
      // @ts-expect-error - simulating server environment
      delete global.window
      const result = strategy.detect()
      expect(result).toBeNull()
    })

    it('should detect exact language match with high confidence', () => {
      stubNavigator({
        languages: ['en', 'zh-CN'],
        language: 'en',
      } as Navigator)

      const result = strategy.detect()
      expect(result).toEqual({ language: 'en', confidence: 0.95 })
    })

    it('should detect language by prefix match', () => {
      stubNavigator({
        languages: ['zh-HK', 'en-US'],
        language: 'zh-HK',
      } as Navigator)

      const result = strategy.detect()
      expect(result).not.toBeNull()
      expect(result?.language).toBe('zh-CN')
      expect(result?.confidence).toBe(0.8)
    })

    it('should fallback to navigator.language when languages not available', () => {
      stubNavigator({
        language: 'ja',
      } as Navigator)

      const result = strategy.detect()
      expect(result).not.toBeNull()
      expect(result?.language).toBe('ja')
    })

    it('should return null for unsupported languages', () => {
      stubNavigator({
        languages: ['fr', 'de'],
        language: 'fr',
      } as Navigator)

      const result = strategy.detect()
      expect(result).toBeNull()
    })

    it('should handle errors gracefully', () => {
      stubNavigator({
        get languages() {
          throw new Error('Navigator error')
        },
        language: 'en',
      } as unknown as Navigator)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = strategy.detect()
      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})
