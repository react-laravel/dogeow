import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  idempotencyTracker,
  generateRequestId,
  deduplicateRequest,
  withIdempotency,
} from '../idempotency'

describe('Idempotency Utilities', () => {
  beforeEach(() => {
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

    it('should handle request factory errors', () => {
      // Note: withIdempotency currently re-throws errors which is correct
      // The test is just verifying the function doesn't swallow errors silently
      expect(() =>
        withIdempotency('/api/test', 'POST', { data: 'value' }, async () => {
          throw new Error('Test error')
        })
      ).rejects.toThrow('Test error')
    })
  })
})
