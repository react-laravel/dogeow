/**
 * Tests for Redis Distributed Lock
 * 
 * These tests verify the server-side distributed lock functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { redisDistributedLock, RedisDistributedLock } from '../distributed-lock'
import { getRedisClient } from '../redis-client'

// Skip tests if Redis is not available
const SKIP_REDIS_TESTS = process.env.SKIP_REDIS_TESTS === 'true'

describe('RedisDistributedLock', () => {
  const testResource = `test-lock-${Date.now()}`
  let lock: RedisDistributedLock

  beforeAll(() => {
    lock = new RedisDistributedLock()
  })

  afterAll(async () => {
    // Clean up any leftover locks
    await lock.forceRelease(testResource)
    await lock.forceRelease(`${testResource}-2`)
  })

  beforeEach(async () => {
    // Clean up before each test
    await lock.forceRelease(testResource)
    await lock.forceRelease(`${testResource}-2`)
  })

  describe('acquire', () => {
    it('should acquire a lock successfully', async () => {
      const result = await lock.acquire(testResource)
      
      expect(result.acquired).toBe(true)
      expect(result.token).toBeDefined()
      expect(result.token).toMatch(/^lock_/)
    })

    it('should fail to acquire lock when already held', async () => {
      // First acquire
      const first = await lock.acquire(testResource)
      expect(first.acquired).toBe(true)

      // Second acquire should fail
      const second = await lock.acquire(testResource, { maxRetries: 0 })
      expect(second.acquired).toBe(false)
      expect(second.error).toBeDefined()
    })

    it('should acquire lock after first is released', async () => {
      // First acquire and release
      const first = await lock.acquire(testResource)
      expect(first.acquired).toBe(true)
      expect(first.token).toBeDefined()

      await lock.release(testResource, first.token!)

      // Second acquire should succeed
      const second = await lock.acquire(testResource)
      expect(second.acquired).toBe(true)
    })

    it('should respect custom TTL', async () => {
      const result = await lock.acquire(testResource, { ttl: 1000 })
      expect(result.acquired).toBe(true)

      // Lock should expire after TTL
      await new Promise(resolve => setTimeout(resolve, 1100))

      const second = await lock.acquire(testResource, { maxRetries: 0 })
      expect(second.acquired).toBe(true)
    })

    it('should retry acquiring lock', async () => {
      // Hold the lock
      const first = await lock.acquire(testResource)
      expect(first.acquired).toBe(true)

      // Try to acquire with retries - should fail
      const second = await lock.acquire(testResource, { 
        maxRetries: 2,
        retryInterval: 50,
      })
      expect(second.acquired).toBe(false)

      // Clean up
      await lock.release(testResource, first.token!)
    })
  })

  describe('release', () => {
    it('should release a lock with correct token', async () => {
      const result = await lock.acquire(testResource)
      expect(result.acquired).toBe(true)
      expect(result.token).toBeDefined()

      const released = await lock.release(testResource, result.token!)
      expect(released).toBe(true)

      // Lock should be available now
      const second = await lock.acquire(testResource, { maxRetries: 0 })
      expect(second.acquired).toBe(true)
    })

    it('should not release lock with incorrect token', async () => {
      const result = await lock.acquire(testResource)
      expect(result.acquired).toBe(true)

      const released = await lock.release(testResource, 'wrong-token')
      expect(released).toBe(false)

      // Lock should still be held
      const second = await lock.acquire(testResource, { maxRetries: 0 })
      expect(second.acquired).toBe(false)

      // Clean up
      await lock.release(testResource, result.token!)
    })
  })

  describe('isLocked', () => {
    it('should return true when resource is locked', async () => {
      const result = await lock.acquire(testResource)
      expect(result.acquired).toBe(true)

      const locked = await lock.isLocked(testResource)
      expect(locked).toBe(true)

      // Clean up
      await lock.release(testResource, result.token!)
    })

    it('should return false when resource is not locked', async () => {
      const locked = await lock.isLocked(testResource)
      expect(locked).toBe(false)
    })
  })

  describe('forceRelease', () => {
    it('should force release a lock regardless of token', async () => {
      const result = await lock.acquire(testResource)
      expect(result.acquired).toBe(true)

      const released = await lock.forceRelease(testResource)
      expect(released).toBe(true)

      // Lock should be available
      const second = await lock.acquire(testResource, { maxRetries: 0 })
      expect(second.acquired).toBe(true)
    })
  })

  describe('extend', () => {
    it('should extend lock TTL with correct token', async () => {
      const result = await lock.acquire(testResource, { ttl: 1000 })
      expect(result.acquired).toBe(true)

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100))

      // Extend should work
      const extended = await lock.extend(testResource, result.token!, 2000)
      expect(extended).toBe(true)

      // Original TTL would have expired, but extended should still hold
      await new Promise(resolve => setTimeout(resolve, 1100))

      const second = await lock.acquire(testResource, { maxRetries: 0 })
      expect(second.acquired).toBe(false) // Should still be locked

      // Clean up
      await lock.release(testResource, result.token!)
    })

    it('should not extend with incorrect token', async () => {
      const result = await lock.acquire(testResource)
      expect(result.acquired).toBe(true)

      const extended = await lock.extend(testResource, 'wrong-token', 2000)
      expect(extended).toBe(false)

      // Clean up
      await lock.release(testResource, result.token!)
    })
  })

  describe('withLock', () => {
    it('should execute function with lock and release after', async () => {
      let executionCount = 0

      const result = await lock.withLock(testResource, async () => {
        executionCount++
        await new Promise(resolve => setTimeout(resolve, 50))
        return 'success'
      })

      expect(result.success).toBe(true)
      expect(result.result).toBe('success')
      expect(executionCount).toBe(1)

      // Lock should be released, so new acquire should work
      const second = await lock.acquire(testResource, { maxRetries: 0 })
      expect(second.acquired).toBe(true)
    })

    it('should release lock even if function throws', async () => {
      const result = await lock.withLock(testResource, async () => {
        throw new Error('Test error')
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Test error')

      // Lock should be released
      const second = await lock.acquire(testResource, { maxRetries: 0 })
      expect(second.acquired).toBe(true)
    })
  })

  describe('concurrent locking', () => {
    it('should handle concurrent lock attempts correctly', async () => {
      const lock1 = await lock.acquire(testResource)
      expect(lock1.acquired).toBe(true)

      // Try to acquire same lock from "another instance"
      const secondLock = new RedisDistributedLock()
      const lock2 = await secondLock.acquire(testResource, { maxRetries: 0 })
      expect(lock2.acquired).toBe(false)

      // Clean up
      await lock.release(testResource, lock1.token!)
    })
  })
})

describe('redisDistributedLock singleton', () => {
  it('should be an instance of RedisDistributedLock', () => {
    expect(redisDistributedLock).toBeInstanceOf(RedisDistributedLock)
  })
})
