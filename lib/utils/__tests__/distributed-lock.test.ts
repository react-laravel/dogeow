import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { distributedLock } from '../distributed-lock'

describe('DistributedLock', () => {
  beforeEach(() => {
    distributedLock.reset()
  })

  afterEach(() => {
    distributedLock.reset()
  })

  describe('acquire', () => {
    it('should acquire a lock on first attempt', async () => {
      const result = await distributedLock.acquire('resource1')

      expect(result.acquired).toBe(true)
      expect(result.token).toBeTruthy()
    })

    it('should refresh lock when same instance acquires again', async () => {
      const result1 = await distributedLock.acquire('resource1')
      expect(result1.acquired).toBe(true)
      const token1 = result1.token

      // Same instance acquiring again should refresh the lock
      const result2 = await distributedLock.acquire('resource1')
      expect(result2.acquired).toBe(true)
      // Same token because it's the same instance
      expect(result2.token).toBe(token1)
    })

    it('should acquire lock after another client releases', async () => {
      // Acquire and then force-release to simulate another client
      const result1 = await distributedLock.acquire('resource1')
      expect(result1.acquired).toBe(true)

      // Force release to simulate another client releasing
      distributedLock.forceRelease('resource1')

      // Should be able to acquire again
      const result2 = await distributedLock.acquire('resource1')
      expect(result2.acquired).toBe(true)
    })

    it('should not release lock with wrong token', async () => {
      const result = await distributedLock.acquire('resource1')
      expect(result.acquired).toBe(true)

      // Try to release with wrong token
      const released = await distributedLock.release('resource1', 'wrong_token')
      expect(released).toBe(false)

      // Lock should still be held
      expect(distributedLock.isLocked('resource1')).toBe(true)
    })

    it('should respect TTL', async () => {
      vi.useFakeTimers()

      const result = await distributedLock.acquire('resource1', { ttl: 5000 })
      expect(result.acquired).toBe(true)

      // Advance time past TTL
      vi.advanceTimersByTime(6000)

      // Lock should be expired
      expect(distributedLock.isLocked('resource1')).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('release', () => {
    it('should release a lock with correct token', async () => {
      const result = await distributedLock.acquire('resource1')
      expect(result.token).toBeTruthy()

      const released = await distributedLock.release('resource1', result.token!)
      expect(released).toBe(true)
      expect(distributedLock.isLocked('resource1')).toBe(false)
    })

    it('should return true when releasing non-existent lock', async () => {
      const released = await distributedLock.release('nonexistent', 'any_token')
      expect(released).toBe(true)
    })
  })

  describe('isLocked', () => {
    it('should return false for unlocked resource', () => {
      expect(distributedLock.isLocked('resource1')).toBe(false)
    })

    it('should return true for locked resource', async () => {
      await distributedLock.acquire('resource1')
      expect(distributedLock.isLocked('resource1')).toBe(true)
    })

    it('should return false after lock is released', async () => {
      const result = await distributedLock.acquire('resource1')
      await distributedLock.release('resource1', result.token!)
      expect(distributedLock.isLocked('resource1')).toBe(false)
    })
  })

  describe('forceRelease', () => {
    it('should force release a lock', async () => {
      const result = await distributedLock.acquire('resource1')
      expect(result.token).toBeTruthy()

      const released = distributedLock.forceRelease('resource1')
      expect(released).toBe(true)
      expect(distributedLock.isLocked('resource1')).toBe(false)
    })

    it('should return false when no lock exists', () => {
      const released = distributedLock.forceRelease('nonexistent')
      expect(released).toBe(false)
    })
  })

  describe('extend', () => {
    it('should extend lock TTL', async () => {
      vi.useFakeTimers()

      const result = await distributedLock.acquire('resource1', { ttl: 5000 })
      expect(result.acquired).toBe(true)

      // Advance time halfway
      vi.advanceTimersByTime(3000)

      // Extend lock
      const extended = await distributedLock.extend('resource1', result.token!, 10000)
      expect(extended).toBe(true)

      // Advance more time but still within new TTL
      vi.advanceTimersByTime(7000)
      expect(distributedLock.isLocked('resource1')).toBe(true)

      // Advance past new TTL
      vi.advanceTimersByTime(5000)
      expect(distributedLock.isLocked('resource1')).toBe(false)

      vi.useRealTimers()
    })

    it('should fail to extend with wrong token', async () => {
      const result = await distributedLock.acquire('resource1')
      expect(result.acquired).toBe(true)

      const extended = await distributedLock.extend('resource1', 'wrong_token', 10000)
      expect(extended).toBe(false)
    })
  })

  describe('withLock', () => {
    it('should execute function with lock', async () => {
      const result = await distributedLock.withLock('resource1', async () => {
        return 'success'
      })

      expect(result.success).toBe(true)
      expect(result.result).toBe('success')
    })

    it('should succeed when same instance already holds lock (refreshes it)', async () => {
      // Same instance holding the lock should succeed (refreshes lock)
      await distributedLock.acquire('resource1')

      const result = await distributedLock.withLock('resource1', async () => 'success')

      expect(result.success).toBe(true)
      expect(result.result).toBe('success')
    })

    it('should return error in result when function throws', async () => {
      const result = await distributedLock.withLock('resource1', async () => {
        throw new Error('Test error')
      })

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Test error')
    })

    it('should release lock after function completes', async () => {
      await distributedLock.withLock('resource1', async () => 'done')

      // Lock should be released after success
      const result = await distributedLock.acquire('resource1')
      expect(result.acquired).toBe(true)
    })

    it('should release lock after function throws', async () => {
      await distributedLock.withLock('resource1', async () => {
        throw new Error('Test error')
      })

      // Lock should be released after error
      const result = await distributedLock.acquire('resource1')
      expect(result.acquired).toBe(true)
    })
  })

  describe('getLocks', () => {
    it('should return all current locks', async () => {
      await distributedLock.acquire('resource1')
      await distributedLock.acquire('resource2')

      const locks = distributedLock.getLocks()
      expect(locks).toHaveLength(2)
      expect(locks.map(l => l.resource)).toContain('resource1')
      expect(locks.map(l => l.resource)).toContain('resource2')
    })

    it('should mark expired locks', async () => {
      vi.useFakeTimers()

      await distributedLock.acquire('resource1', { ttl: 5000 })

      vi.advanceTimersByTime(6000)

      const locks = distributedLock.getLocks()
      expect(locks[0].expired).toBe(true)

      vi.useRealTimers()
    })
  })

  describe('reset', () => {
    it('should clear all locks', async () => {
      await distributedLock.acquire('resource1')
      await distributedLock.acquire('resource2')

      distributedLock.reset()

      expect(distributedLock.isLocked('resource1')).toBe(false)
      expect(distributedLock.isLocked('resource2')).toBe(false)
    })
  })
})
