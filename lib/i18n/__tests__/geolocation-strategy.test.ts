import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GeolocationStrategy } from '../strategies/GeolocationStrategy'

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

describe('GeolocationStrategy', () => {
  let strategy: GeolocationStrategy
  let mockLocalStorage: ReturnType<typeof createLocalStorageMock>

  beforeEach(() => {
    mockLocalStorage = createLocalStorageMock()
    strategy = new GeolocationStrategy()
    vi.clearAllMocks()
  })

  describe('detect', () => {
    it('should return null in non-browser environment', () => {
      // @ts-expect-error - simulating server environment
      delete globalThis.window
      const result = strategy.detect()
      expect(result).toBeNull()
    })

    it('should return cached result when available', () => {
      // Set up the browser environment
      ;(globalThis as Record<string, unknown>).window = {
        localStorage: mockLocalStorage,
      }

      mockLocalStorage.setItem(
        'dogeow-geo-language',
        JSON.stringify({ language: 'zh-CN', timestamp: Date.now() })
      )

      const result = strategy.detect()
      expect(result).not.toBeNull()
      expect(result?.language).toBe('zh-CN')
      expect(result?.confidence).toBe(0.75)
    })

    it('should detect by timezone when no cache', () => {
      ;(globalThis as Record<string, unknown>).window = {
        localStorage: mockLocalStorage,
      }

      // Mock Intl.DateTimeFormat
      const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions
      Intl.DateTimeFormat.prototype.resolvedOptions = () =>
        ({
          timeZone: 'Asia/Shanghai',
        }) as Intl.DateTimeFormatOptions

      try {
        const result = strategy.detect()
        expect(result).not.toBeNull()
        expect(result?.language).toBe('zh-CN')
        expect(result?.confidence).toBe(0.75)
      } finally {
        Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions
      }
    })

    it('should return null for unknown timezone', () => {
      ;(globalThis as Record<string, unknown>).window = {
        localStorage: mockLocalStorage,
      }

      const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions
      Intl.DateTimeFormat.prototype.resolvedOptions = () =>
        ({
          timeZone: 'Unknown/Timezone',
        }) as Intl.DateTimeFormatOptions

      try {
        const result = strategy.detect()
        expect(result).toBeNull()
      } finally {
        Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions
      }
    })

    it('should ignore expired cache', () => {
      ;(globalThis as Record<string, unknown>).window = {
        localStorage: mockLocalStorage,
      }

      // Set expired cache (25 hours ago)
      mockLocalStorage.setItem(
        'dogeow-geo-language',
        JSON.stringify({
          language: 'ja',
          timestamp: Date.now() - 25 * 60 * 60 * 1000,
        })
      )

      const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions
      Intl.DateTimeFormat.prototype.resolvedOptions = () =>
        ({
          timeZone: 'Asia/Tokyo',
        }) as Intl.DateTimeFormatOptions

      try {
        const result = strategy.detect()
        // Should fall through to timezone detection since cache is expired
        expect(result).not.toBeNull()
        expect(result?.language).toBe('ja')
      } finally {
        Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions
      }
    })

    it('should handle errors gracefully', () => {
      ;(globalThis as Record<string, unknown>).window = {
        localStorage: {
          getItem: vi.fn(() => {
            throw new Error('localStorage error')
          }),
        },
      }
      const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions
      Intl.DateTimeFormat.prototype.resolvedOptions = () =>
        ({
          timeZone: 'Unknown/Timezone',
        }) as Intl.DateTimeFormatOptions

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      try {
        const result = strategy.detect()
        expect(result).toBeNull()
        expect(consoleSpy).toHaveBeenCalled()
      } finally {
        Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions
      }

      consoleSpy.mockRestore()
    })
  })
})
