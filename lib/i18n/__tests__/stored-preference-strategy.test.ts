import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StoredPreferenceStrategy } from '../strategies/StoredPreferenceStrategy'

const createLocalStorageMock = () => {
  const store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
  }
}

describe('StoredPreferenceStrategy', () => {
  let strategy: StoredPreferenceStrategy
  let mockLocalStorage: ReturnType<typeof createLocalStorageMock>

  beforeEach(() => {
    mockLocalStorage = createLocalStorageMock()
    strategy = new StoredPreferenceStrategy()
    vi.clearAllMocks()
  })

  describe('detect', () => {
    it('should return null in non-browser environment', () => {
      // @ts-expect-error - simulating server environment
      delete globalThis.window
      const result = strategy.detect()
      expect(result).toBeNull()
    })

    it('should return stored preference with full confidence', () => {
      mockLocalStorage.setItem('dogeow-language-preference', 'zh-CN')
      ;(globalThis as Record<string, unknown>).window = {
        localStorage: mockLocalStorage,
      }

      const result = strategy.detect()
      expect(result).toEqual({
        language: 'zh-CN',
        confidence: 1.0,
      })
    })

    it('should return stored English preference', () => {
      mockLocalStorage.setItem('dogeow-language-preference', 'en')
      ;(globalThis as Record<string, unknown>).window = {
        localStorage: mockLocalStorage,
      }

      const result = strategy.detect()
      expect(result).toEqual({
        language: 'en',
        confidence: 1.0,
      })
    })

    it('should return null when no preference stored', () => {
      ;(globalThis as Record<string, unknown>).window = {
        localStorage: mockLocalStorage,
      }

      const result = strategy.detect()
      expect(result).toBeNull()
    })

    it('should return null for unsupported stored language', () => {
      mockLocalStorage.setItem('dogeow-language-preference', 'fr')
      ;(globalThis as Record<string, unknown>).window = {
        localStorage: mockLocalStorage,
      }

      const result = strategy.detect()
      expect(result).toBeNull()
    })

    it('should handle localStorage errors gracefully', () => {
      ;(globalThis as Record<string, unknown>).window = {
        localStorage: {
          getItem: vi.fn(() => {
            throw new Error('localStorage access denied')
          }),
        },
      }

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = strategy.detect()
      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})
