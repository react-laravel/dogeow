import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  idempotencyTracker,
  generateRequestId,
  deduplicateRequest,
  withIdempotency,
  withIdempotencyAndLock,
  type IdempotentResult,
} from '../idempotency'

describe('Idempotency Utilities', () => {
  beforeEach(() => {
    idempotencyTracker.reset()
  })

  afterEach(() => {
    idempotencyTracker.reset()
  })

  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId()
      const id2 = generateRequestId()

      expect(id1).toBeTruthy()
      expect(id2).toBeTruthy()
      expect(id1).not.toBe(id2)
    })

    it('should generate request ID with correct format', () => {
      const id = generateRequestId()
      expect(id).toMatch(/^req_/)
    })
  })

  describe('IdempotencyTracker', () => {
    describe('generateKey', () => {
      it('should generate consistent keys for same input', () => {
        const key1 = idempotencyTracker.generateKey('/api/test', 'POST', { data: 'value' })
        const key2 = idempotencyTracker.generateKey('/api/test', 'POST', { data: 'value' })

        expect(key1).toBe(key2)
      })

      it('should generate different keys for different inputs', () => {
        const key1 = idempotencyTracker.generateKey('/api/test', 'POST', { data: 'value1' })
        const key2 = idempotencyTracker.generateKey('/api/test', 'POST', { data: 'value2' })

        expect(key1).not.toBe(key2)
      })

      it('should generate different keys for different methods', () => {
        const key1 = idempotencyTracker.generateKey('/api/test', 'POST', { data: 'value' })
        const key2 = idempotencyTracker.generateKey('/api/test', 'PUT', { data: 'value' })

        expect(key1).not.toBe(key2)
      })

      it('should generate different keys for different endpoints', () => {
        const key1 = idempotencyTracker.generateKey('/api/test1', 'POST', { data: 'value' })
        const key2 = idempotencyTracker.generateKey('/api/test2', 'POST', { data: 'value' })

        expect(key1).not.toBe(key2)
      })
    })

    describe('isRequestPending', () => {
      it('should return false for new key', () => {
        expect(idempotencyTracker.isRequestPending('new_key')).toBe(false)
      })
    })

    describe('trackRequest', () => {
      it('should track a request and return the same promise for same key', async () => {
        const key = 'test_key'
        const promise = Promise.resolve('result')

        const result1 = idempotencyTracker.trackRequest(key, promise)
        const result2 = idempotencyTracker.trackRequest(key, Promise.resolve('other'))

        expect(result1).toBe(result2)
      })

      it('should allow tracking different keys', async () => {
        const promise1 = Promise.resolve('result1')
        const promise2 = Promise.resolve('result2')

        const result1 = idempotencyTracker.trackRequest('key1', promise1)
        const result2 = idempotencyTracker.trackRequest('key2', promise2)

        expect(result1).not.toBe(result2)
      })

      it('should store result in history after request completes', async () => {
        const key = 'result_key'
        const testResult = { id: 1, data: 'test' }

        await idempotencyTracker.trackRequest(key, Promise.resolve(testResult))

        // Wait for promise to settle
        await new Promise(resolve => setTimeout(resolve, 10))

        expect(idempotencyTracker.wasRecentlyCompleted(key)).toBe(true)
        expect(idempotencyTracker.getRecentResult(key)).toEqual(testResult)
      })

      it('should store error in history after request fails', async () => {
        const key = 'error_key'
        const error = new Error('Request failed')

        // Catch the rejection to prevent unhandled promise rejection
        await idempotencyTracker.trackRequest(key, Promise.reject(error)).catch(() => {})

        // Wait for promise to settle
        await new Promise(resolve => setTimeout(resolve, 10))

        expect(idempotencyTracker.wasRecentlyCompleted(key)).toBe(true)
        // getRecentResult returns undefined for failed requests
        expect(idempotencyTracker.getRecentResult(key)).toBeUndefined()
      })
    })

    describe('getRecentResult', () => {
      it('should return undefined for unknown key', () => {
        expect(idempotencyTracker.getRecentResult('unknown_key')).toBeUndefined()
      })

      it('should return cached result for recently completed request', async () => {
        const key = 'cached_key'
        const cachedData = { items: [1, 2, 3] }

        await idempotencyTracker.trackRequest(key, Promise.resolve(cachedData))
        await new Promise(resolve => setTimeout(resolve, 10))

        expect(idempotencyTracker.getRecentResult(key)).toEqual(cachedData)
      })

      it('should return undefined for expired entries', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true })

        const key = 'expired_key'
        const cachedData = { data: 'old' }

        // Create a promise that resolves after a timer
        let resolvePromise: () => void
        const promise = new Promise<void>(resolve => {
          resolvePromise = resolve
          setTimeout(resolve, 10)
        })

        await idempotencyTracker.trackRequest(
          key,
          promise.then(() => cachedData)
        )

        // Advance time to fire the timer
        await vi.advanceTimersByTimeAsync(20)

        expect(idempotencyTracker.getRecentResult(key)).toEqual(cachedData)

        // Advance time past TTL (5 minutes)
        await vi.advanceTimersByTimeAsync(6 * 60 * 1000)

        expect(idempotencyTracker.getRecentResult(key)).toBeUndefined()

        vi.useRealTimers()
      })
    })
  })

  describe('deduplicateRequest', () => {
    it('should deduplicate concurrent requests', async () => {
      const key = 'dedup_key'
      let callCount = 0

      const factory = async () => {
        callCount++
        return `result_${callCount}`
      }

      const [result1, result2] = await Promise.all([
        deduplicateRequest(key, factory),
        deduplicateRequest(key, factory),
      ])

      // Both should get the same result (from the first call)
      expect(result1).toBe(result2)
      // But factory should only be called once
      expect(callCount).toBe(1)
    })

    it('should allow different keys', async () => {
      let callCount = 0

      const factory = async () => {
        callCount++
        return `result_${callCount}`
      }

      const [result1, result2] = await Promise.all([
        deduplicateRequest('key1', factory),
        deduplicateRequest('key2', factory),
      ])

      expect(result1).toBe('result_1')
      expect(result2).toBe('result_2')
      expect(callCount).toBe(2)
    })
  })

  describe('withIdempotency', () => {
    it('should execute the request factory', async () => {
      const result = await withIdempotency(
        '/api/test',
        'POST',
        { data: 'value' },
        async () => 'success'
      )

      expect(result).toBe('success')
    })

    it('should handle request factory errors', async () => {
      // Note: withIdempotency currently re-throws errors which is correct
      // The test is just verifying the function doesn't swallow errors silently
      await expect(
        withIdempotency('/api/test', 'POST', { data: 'value' }, async () => {
          throw new Error('Test error')
        })
      ).rejects.toThrow('Test error')
    })

    it('should return cached result for recently completed request', async () => {
      const endpoint = '/api/cached'
      const data = { id: 123 }
      let callCount = 0

      const factory = async () => {
        callCount++
        return `result_${callCount}`
      }

      // First call should execute the factory
      const result1 = await withIdempotency(endpoint, 'POST', data, factory)
      expect(result1).toBe('result_1')
      expect(callCount).toBe(1)

      // Second call with same endpoint/method/data should return cached result
      const result2 = await withIdempotency(endpoint, 'POST', data, factory)
      expect(result2).toBe('result_1') // Same as first result
      expect(callCount).toBe(1) // Factory should not be called again
    })

    it('should execute factory for different data', async () => {
      const endpoint = '/api/test'
      let callCount = 0

      const factory = async () => {
        callCount++
        return `result_${callCount}`
      }

      await withIdempotency(endpoint, 'POST', { data: 'value1' }, factory)
      await withIdempotency(endpoint, 'POST', { data: 'value2' }, factory)

      expect(callCount).toBe(2)
    })

    it('should deduplicate concurrent requests', async () => {
      const endpoint = '/api/concurrent'
      const data = { test: true }
      let callCount = 0

      const factory = async () => {
        callCount++
        return `result_${callCount}`
      }

      // Make concurrent requests with same key
      const [result1, result2, result3] = await Promise.all([
        withIdempotency(endpoint, 'POST', data, factory),
        withIdempotency(endpoint, 'POST', data, factory),
        withIdempotency(endpoint, 'POST', data, factory),
      ])

      // All should get the same result
      expect(result1).toBe(result2)
      expect(result2).toBe(result3)
      // But factory should only be called once
      expect(callCount).toBe(1)
    })
  })

  describe('withIdempotencyAndLock', () => {
    it('should execute request with idempotency and lock protection', async () => {
      const endpoint = '/api/test'
      const data = { action: 'test' }
      let callCount = 0

      const factory = async () => {
        callCount++
        return { success: true, data: 'result' }
      }

      const result: IdempotentResult<{ success: boolean; data: string }> =
        await withIdempotencyAndLock(endpoint, 'POST', data, factory)

      expect(result.success).toBe(true)
      expect(result.result?.success).toBe(true)
      expect(result.result?.data).toBe('result')
      expect(result.isDuplicate).toBe(false)
      expect(callCount).toBe(1)
    })

    it('should detect duplicate requests and return cached result', async () => {
      const endpoint = '/api/duplicate'
      const data = { id: 123 }
      let callCount = 0

      const factory = async () => {
        callCount++
        return { value: `computed_${callCount}` }
      }

      // First request
      const result1: IdempotentResult<{ value: string }> = await withIdempotencyAndLock(
        endpoint,
        'POST',
        data,
        factory
      )
      expect(result1.success).toBe(true)
      expect(result1.result?.value).toBe('computed_1')
      expect(callCount).toBe(1)

      // Duplicate request should return cached result
      const result2: IdempotentResult<{ value: string }> = await withIdempotencyAndLock(
        endpoint,
        'POST',
        data,
        factory
      )
      expect(result2.success).toBe(true)
      expect(result2.isDuplicate).toBe(true)
      expect(result2.result?.value).toBe('computed_1') // Same as first
      expect(callCount).toBe(1) // Factory not called again
    })

    it('should handle request factory errors', async () => {
      const endpoint = '/api/error'
      const data = { trigger: 'error' }

      const factory = async () => {
        throw new Error('Factory error')
      }

      const result: IdempotentResult<unknown> = await withIdempotencyAndLock(
        endpoint,
        'POST',
        data,
        factory
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error?.message).toBe('Factory error')
      expect(result.isDuplicate).toBe(false)
    })

    it('should generate request ID for each request', async () => {
      const endpoint = '/api/request-id'
      const data = {}

      const factory = async () => 'done'

      const result = await withIdempotencyAndLock(endpoint, 'POST', data, factory)

      expect(result.requestId).toBeTruthy()
      expect(result.requestId).toMatch(/^req_/)
    })

    it('should call onDuplicate callback when duplicate is detected', async () => {
      const endpoint = '/api/callback'
      const data = { key: 'value' }
      let callCount = 0

      const factory = async () => {
        callCount++
        return { count: callCount }
      }

      const onDuplicate = vi.fn()

      // First request
      await withIdempotencyAndLock(endpoint, 'POST', data, factory, { onDuplicate })
      expect(callCount).toBe(1)

      // Duplicate request
      await withIdempotencyAndLock(endpoint, 'POST', data, factory, { onDuplicate })
      expect(callCount).toBe(1) // Factory not called again

      // onDuplicate should have been called
      expect(onDuplicate).toHaveBeenCalledTimes(1)
      expect(onDuplicate).toHaveBeenCalledWith({ count: 1 })
    })

    it('should treat different data as different requests', async () => {
      const endpoint = '/api/different'
      let callCount = 0

      const factory = async () => {
        callCount++
        return { n: callCount }
      }

      const result1 = await withIdempotencyAndLock(endpoint, 'POST', { a: 1 }, factory)
      const result2 = await withIdempotencyAndLock(endpoint, 'POST', { b: 2 }, factory)

      expect(result1.result?.n).toBe(1)
      expect(result2.result?.n).toBe(2)
      expect(callCount).toBe(2)
    })

    it('should treat different endpoints as different requests', async () => {
      const data = {}
      let callCount = 0

      const factory = async () => {
        callCount++
        return { n: callCount }
      }

      const result1 = await withIdempotencyAndLock('/api/one', 'POST', data, factory)
      const result2 = await withIdempotencyAndLock('/api/two', 'POST', data, factory)

      expect(result1.result?.n).toBe(1)
      expect(result2.result?.n).toBe(2)
      expect(callCount).toBe(2)
    })

    it('should treat different methods as different requests', async () => {
      const endpoint = '/api/method'
      const data = {}
      let callCount = 0

      const factory = async () => {
        callCount++
        return { n: callCount }
      }

      const result1 = await withIdempotencyAndLock(endpoint, 'POST', data, factory)
      const result2 = await withIdempotencyAndLock(endpoint, 'PUT', data, factory)

      expect(result1.result?.n).toBe(1)
      expect(result2.result?.n).toBe(2)
      expect(callCount).toBe(2)
    })
  })
})
