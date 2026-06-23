import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LanguageDetectionCache, DETECTION_CONFIG, createDefaultResult } from '../language-cache'
import type { LanguageDetectionResult, DetectionMethod } from '../language-detection-service'

describe('language-cache', () => {
  describe('DETECTION_CONFIG', () => {
    it('should have correct cache duration', () => {
      expect(DETECTION_CONFIG.CACHE_DURATION).toBe(24 * 60 * 60 * 1000)
    })

    it('should have log throttle', () => {
      expect(DETECTION_CONFIG.LOG_THROTTLE_MS).toBe(2000)
    })

    it('should have geo cache duration', () => {
      expect(DETECTION_CONFIG.GEO_CACHE_DURATION).toBe(24 * 60 * 60 * 1000)
    })

    it('should have detection timeout', () => {
      expect(DETECTION_CONFIG.DETECTION_TIMEOUT).toBe(5000)
    })

    it('should have polling interval', () => {
      expect(DETECTION_CONFIG.POLLING_INTERVAL).toBe(100)
    })
  })

  describe('LanguageDetectionCache', () => {
    let cache: LanguageDetectionCache

    beforeEach(() => {
      cache = new LanguageDetectionCache()
    })

    describe('get and set', () => {
      it('should return undefined for missing key', () => {
        expect(cache.get('missing')).toBeUndefined()
      })

      it('should store and retrieve values', () => {
        const result: LanguageDetectionResult = {
          language: 'en',
          confidence: 0.9,
          method: 'browser',
          timestamp: Date.now(),
        }
        cache.set('test-key', result)
        expect(cache.get('test-key')).toEqual(result)
      })

      it('should store multiple values', () => {
        const result1: LanguageDetectionResult = {
          language: 'en',
          confidence: 0.9,
          method: 'browser',
          timestamp: Date.now() - 1000,
        }
        const result2: LanguageDetectionResult = {
          language: 'zh-CN',
          confidence: 0.8,
          method: 'geolocation',
          timestamp: Date.now(),
        }

        cache.set('key1', result1)
        cache.set('key2', result2)

        expect(cache.get('key1')).toEqual(result1)
        expect(cache.get('key2')).toEqual(result2)
      })
    })

    describe('isCacheValid', () => {
      it('should return true for fresh cache', () => {
        const result: LanguageDetectionResult = {
          language: 'en',
          confidence: 0.9,
          method: 'browser',
          timestamp: Date.now(),
        }
        expect(cache.isCacheValid(result)).toBe(true)
      })

      it('should return false for expired cache', () => {
        const result: LanguageDetectionResult = {
          language: 'en',
          confidence: 0.9,
          method: 'browser',
          timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        }
        expect(cache.isCacheValid(result)).toBe(false)
      })

      it('should return true for cache at boundary', () => {
        const result: LanguageDetectionResult = {
          language: 'en',
          confidence: 0.9,
          method: 'browser',
          timestamp: Date.now() - 24 * 60 * 60 * 1000 + 1000, // Just under 24 hours
        }
        expect(cache.isCacheValid(result)).toBe(true)
      })
    })

    describe('getCacheKey', () => {
      it('should return key for with-preference mode', () => {
        expect(cache.getCacheKey({})).toBe('language-detection:with-pref')
      })

      it('should return key for no-preference mode', () => {
        expect(cache.getCacheKey({ ignoreStoredPreference: true })).toBe(
          'language-detection:no-pref'
        )
      })
    })

    describe('clear', () => {
      it('should remove all cached entries', () => {
        cache.set('key1', {
          language: 'en',
          confidence: 0.9,
          method: 'browser',
          timestamp: Date.now(),
        } as LanguageDetectionResult)
        cache.set('key2', {
          language: 'zh-CN',
          confidence: 0.8,
          method: 'geolocation',
          timestamp: Date.now(),
        } as LanguageDetectionResult)

        expect(cache.size).toBe(2)

        cache.clear()

        expect(cache.size).toBe(0)
        expect(cache.get('key1')).toBeUndefined()
        expect(cache.get('key2')).toBeUndefined()
      })
    })

    describe('size', () => {
      it('should return 0 for empty cache', () => {
        expect(cache.size).toBe(0)
      })

      it('should return correct count after adding entries', () => {
        cache.set('key1', {
          language: 'en',
          confidence: 0.9,
          method: 'browser',
          timestamp: Date.now(),
        } as LanguageDetectionResult)
        cache.set('key2', {
          language: 'zh-CN',
          confidence: 0.8,
          method: 'geolocation',
          timestamp: Date.now(),
        } as LanguageDetectionResult)

        expect(cache.size).toBe(2)
      })

      it('should return 0 after clear', () => {
        cache.set('key1', {
          language: 'en',
          confidence: 0.9,
          method: 'browser',
          timestamp: Date.now(),
        } as LanguageDetectionResult)
        cache.clear()
        expect(cache.size).toBe(0)
      })
    })

    describe('getLastDetection', () => {
      it('should return undefined for empty cache', () => {
        expect(cache.getLastDetection()).toBeUndefined()
      })

      it('should return the most recent timestamp', () => {
        const now = Date.now()
        cache.set('old', {
          language: 'en',
          confidence: 0.9,
          method: 'browser',
          timestamp: now - 5000,
        } as LanguageDetectionResult)
        cache.set('new', {
          language: 'zh-CN',
          confidence: 0.8,
          method: 'geolocation',
          timestamp: now,
        } as LanguageDetectionResult)

        expect(cache.getLastDetection()).toBe(now)
      })
    })
  })

  describe('createDefaultResult', () => {
    it('should create result with default method', () => {
      const result = createDefaultResult()
      expect(result.language).toBe('zh-CN')
      expect(result.confidence).toBe(0.5)
      expect(result.method).toBe('default')
      expect(result.timestamp).toBeDefined()
    })

    it('should create result with custom method', () => {
      const result = createDefaultResult('browser')
      expect(result.method).toBe('browser')
      expect(result.language).toBe('zh-CN')
    })

    it('should create result with geolocation method', () => {
      const result = createDefaultResult('geolocation')
      expect(result.method).toBe('geolocation')
    })

    it('should have recent timestamp', () => {
      const before = Date.now()
      const result = createDefaultResult()
      const after = Date.now()

      expect(result.timestamp).toBeGreaterThanOrEqual(before)
      expect(result.timestamp).toBeLessThanOrEqual(after)
    })
  })
})
