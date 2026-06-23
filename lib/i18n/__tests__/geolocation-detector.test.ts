import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GeolocationDetector } from '../geolocation-detector'

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

describe('GeolocationDetector', () => {
  let detector: GeolocationDetector
  let mockLocalStorage: ReturnType<typeof createLocalStorageMock>

  beforeEach(() => {
    mockLocalStorage = createLocalStorageMock()
    detector = new GeolocationDetector()
    vi.clearAllMocks()
  })

  describe('detectByTimezone', () => {
    it('should return null when timezone is unavailable', () => {
      const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions
      Intl.DateTimeFormat.prototype.resolvedOptions = () =>
        ({
          timeZone: undefined,
        }) as unknown as Intl.DateTimeFormatOptions

      try {
        const result = detector.detectByTimezone()
        expect(result).toBeNull()
      } finally {
        Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions
      }
    })

    it('should detect language from timezone', () => {
      const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions
      Intl.DateTimeFormat.prototype.resolvedOptions = () =>
        ({
          timeZone: 'Asia/Shanghai',
        }) as Intl.DateTimeFormatOptions

      try {
        const result = detector.detectByTimezone()
        expect(result).not.toBeNull()
        expect(result?.language).toBe('zh-CN')
        expect(result?.confidence).toBe(0.75)
        expect(result?.method).toBe('geolocation')
      } finally {
        Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions
      }
    })

    it('should detect Japanese from Tokyo timezone', () => {
      const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions
      Intl.DateTimeFormat.prototype.resolvedOptions = () =>
        ({
          timeZone: 'Asia/Tokyo',
        }) as Intl.DateTimeFormatOptions

      try {
        const result = detector.detectByTimezone()
        expect(result).not.toBeNull()
        expect(result?.language).toBe('ja')
      } finally {
        Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions
      }
    })

    it('should detect English from New York timezone', () => {
      const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions
      Intl.DateTimeFormat.prototype.resolvedOptions = () =>
        ({
          timeZone: 'America/New_York',
        }) as Intl.DateTimeFormatOptions

      try {
        const result = detector.detectByTimezone()
        expect(result).not.toBeNull()
        expect(result?.language).toBe('en')
      } finally {
        Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions
      }
    })

    it('should return null for unknown timezone', () => {
      const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions
      Intl.DateTimeFormat.prototype.resolvedOptions = () =>
        ({
          timeZone: 'Unknown/Timezone',
        }) as Intl.DateTimeFormatOptions

      try {
        const result = detector.detectByTimezone()
        expect(result).toBeNull()
      } finally {
        Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions
      }
    })

    it('should handle errors gracefully', () => {
      const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions
      Intl.DateTimeFormat.prototype.resolvedOptions = () => {
        throw new Error('DateTimeFormat error')
      }

      try {
        const result = detector.detectByTimezone()
        expect(result).toBeNull()
      } finally {
        Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions
      }
    })
  })

  describe('getCachedGeolocationData', () => {
    it('should return null when no cache exists', () => {
      ;(globalThis as Record<string, unknown>).window = {
        localStorage: mockLocalStorage,
      }

      const result = detector.getCachedGeolocationData()
      expect(result).toBeNull()
    })

    it('should return cached data when valid', () => {
      mockLocalStorage.setItem(
        'dogeow-geo-language',
        JSON.stringify({ language: 'zh-CN', timestamp: Date.now() })
      )
      ;(globalThis as Record<string, unknown>).window = {
        localStorage: mockLocalStorage,
      }

      const result = detector.getCachedGeolocationData()
      expect(result).not.toBeNull()
      expect(result?.language).toBe('zh-CN')
      expect(result?.confidence).toBe(0.75)
      expect(result?.method).toBe('geolocation')
    })

    it('should return null for expired cache', () => {
      mockLocalStorage.setItem(
        'dogeow-geo-language',
        JSON.stringify({
          language: 'ja',
          timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        })
      )
      ;(globalThis as Record<string, unknown>).window = {
        localStorage: mockLocalStorage,
      }

      const result = detector.getCachedGeolocationData()
      expect(result).toBeNull()
    })

    it('should return null for malformed cache', () => {
      mockLocalStorage.setItem('dogeow-geo-language', 'not-valid-json')
      ;(globalThis as Record<string, unknown>).window = {
        localStorage: mockLocalStorage,
      }

      const result = detector.getCachedGeolocationData()
      expect(result).toBeNull()
    })

    it('should return null in server environment', () => {
      // @ts-expect-error - simulating server environment
      delete globalThis.window
      const result = detector.getCachedGeolocationData()
      expect(result).toBeNull()
    })
  })

  describe('cacheGeolocationData', () => {
    it('should store language in localStorage', () => {
      ;(globalThis as Record<string, unknown>).window = {
        localStorage: mockLocalStorage,
      }

      detector.cacheGeolocationData('zh-CN')

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'dogeow-geo-language',
        expect.stringContaining('"language":"zh-CN"')
      )
    })

    it('should include timestamp in cache', () => {
      ;(globalThis as Record<string, unknown>).window = {
        localStorage: mockLocalStorage,
      }

      const before = Date.now()
      detector.cacheGeolocationData('en')
      const after = Date.now()

      const cachedValue = mockLocalStorage.setItem.mock.calls.find(
        (call: string[]) => call[0] === 'dogeow-geo-language'
      )?.[1]

      expect(cachedValue).toBeDefined()
      const parsed = JSON.parse(cachedValue!)
      expect(parsed.timestamp).toBeGreaterThanOrEqual(before)
      expect(parsed.timestamp).toBeLessThanOrEqual(after)
    })

    it('should do nothing in server environment', () => {
      // @ts-expect-error - simulating server environment
      delete globalThis.window

      detector.cacheGeolocationData('zh-CN')

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('clearCache', () => {
    it('should remove geolocation cache from localStorage', () => {
      ;(globalThis as Record<string, unknown>).window = {
        localStorage: mockLocalStorage,
      }

      mockLocalStorage.setItem('dogeow-geo-language', 'some-data')
      detector.clearCache()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('dogeow-geo-language')
    })

    it('should do nothing in server environment', () => {
      // @ts-expect-error - simulating server environment
      delete globalThis.window

      detector.clearCache()

      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled()
    })
  })
})
