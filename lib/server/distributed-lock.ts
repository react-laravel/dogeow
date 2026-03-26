/**
 * Server-side Redis Distributed Lock
 * Provides distributed locking across multiple server instances
 * 
 * Uses Redis SET with NX and PX options for atomic lock acquisition
 * Implements the Redlock-inspired single-instance algorithm
 */

import { getRedisClient, getRedisAdapter, LOCK_TTL } from './redis-client'

interface LockOptions {
  /** Time in ms before lock automatically expires (default: 60000) */
  ttl?: number
  /** Time in ms between lock acquisition retry attempts (default: 100) */
  retryInterval?: number
  /** Maximum number of retry attempts (default: 50) */
  maxRetries?: number
}

interface LockResult {
  acquired: boolean
  token?: string
  error?: string
}

const DEFAULT_LOCK_TTL = LOCK_TTL
const DEFAULT_RETRY_INTERVAL = 100 // 100ms
const DEFAULT_MAX_RETRIES = 50 // 5 seconds total

/**
 * Redis-based Distributed Lock Manager
 * Provides atomic lock acquisition and release using Redis SET NX PX
 */
export class RedisDistributedLock {
  private keyPrefix = 'lock:'

  /**
   * Generate a unique lock token
   */
  private generateToken(): string {
    return `lock_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * Get the full lock key
   */
  private getLockKey(resource: string): string {
    return `${this.keyPrefix}${resource}`
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Attempt to acquire a lock on a resource
   * Uses Redis SET with NX (only set if not exists) and PX (millisecond expiry)
   * 
   * @returns LockResult with acquired=true and token if lock was acquired
   */
  async acquire(
    resource: string,
    options: LockOptions = {}
  ): Promise<LockResult> {
    const {
      ttl = DEFAULT_LOCK_TTL,
      retryInterval = DEFAULT_RETRY_INTERVAL,
      maxRetries = DEFAULT_MAX_RETRIES,
    } = options

    const redis = getRedisClient()
    const lockKey = this.getLockKey(resource)
    const token = this.generateToken()

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Use raw Redis client for atomic SET NX PX
        const adapter = getRedisAdapter()
        if (adapter?.client) {
          // Use raw Redis command for atomic lock acquisition
          const client = adapter.client as {
            set: (key: string, value: string, options: { NX: true; PX: number }) => Promise<string | null>
          }
          const result = await client.set(lockKey, token, { NX: true, PX: ttl })

          if (result === 'OK') {
            return { acquired: true, token }
          }
        } else {
          // Fallback: use Keyv set with atomic Lua script
          // Use a Lua script to atomically check and set
          const adapter = getRedisAdapter()
          if (adapter?.client) {
            // Use Lua script for atomic check-and-set
            const luaScript = `
              local existing = redis.call("GET", KEYS[1])
              if not existing then
                redis.call("SET", KEYS[1], ARGV[1], "PX", ARGV[2])
                return 1
              end
              return 0
            `

            const client = adapter.client as {
              eval: (script: string, options: { keys: string[]; arguments: string[] }) => Promise<number>
            }
            const scriptResult = await client.eval(luaScript, {
              keys: [lockKey],
              arguments: [token, ttl.toString()],
            })

            if (scriptResult === 1) {
              return { acquired: true, token }
            }
          } else {
            // Final fallback: non-atomic (only if no Lua support)
            const existing = await redis.get<string>(lockKey)
            if (!existing) {
              const setResult = await redis.set(lockKey, token, ttl)
              if (setResult === true) {
                return { acquired: true, token }
              }
            }
          }
        }

        // Lock is held, wait and retry
        if (attempt < maxRetries) {
          await this.sleep(retryInterval)
        }
      } catch (error) {
        console.error(`[RedisLock] Error acquiring lock for ${resource}:`, error)
        return { 
          acquired: false, 
          error: error instanceof Error ? error.message : 'Lock acquisition failed' 
        }
      }
    }

    return { 
      acquired: false, 
      error: `Failed to acquire lock after ${maxRetries + 1} attempts` 
    }
  }

  /**
   * Release a lock
   * Uses a Lua script to ensure atomicity - only deletes if token matches
   * 
   * @returns true if lock was released, false otherwise
   */
  async release(resource: string, token: string): Promise<boolean> {
    const lockKey = this.getLockKey(resource)

    try {
      const adapter = getRedisAdapter()
      if (adapter?.client) {
        // Use Lua script for atomic check-and-delete
        const luaScript = `
          if redis.call("GET", KEYS[1]) == ARGV[1] then
            return redis.call("DEL", KEYS[1])
          else
            return 0
          end
        `

        const client = adapter.client as {
          eval: (script: string, options: { keys: string[]; arguments: string[] }) => Promise<number>
        }
        const result = await client.eval(luaScript, {
          keys: [lockKey],
          arguments: [token],
        })

        const released = result === 1
        if (released) {
          console.log(`[RedisLock] Released lock: ${resource}`)
        } else {
          console.log(`[RedisLock] Failed to release lock (token mismatch or already expired): ${resource}`)
        }
        return released
      } else {
        // Fallback: non-atomic release
        const redis = getRedisClient()
        const existing = await redis.get<string>(lockKey)
        if (existing === token) {
          const deleted = await redis.delete(lockKey)
          return deleted === true
        }
        return false
      }
    } catch (error) {
      console.error(`[RedisLock] Error releasing lock for ${resource}:`, error)
      return false
    }
  }

  /**
   * Extend a lock's TTL
   * Only extends if the token matches (atomic check-and-extend)
   * 
   * @returns true if lock was extended, false otherwise
   */
  async extend(resource: string, token: string, ttl: number = DEFAULT_LOCK_TTL): Promise<boolean> {
    const lockKey = this.getLockKey(resource)

    try {
      const adapter = getRedisAdapter()
      if (adapter?.client) {
        // Lua script for atomic check-and-extend
        const luaScript = `
          if redis.call("GET", KEYS[1]) == ARGV[1] then
            return redis.call("PEXPIRE", KEYS[1], ARGV[2])
          else
            return 0
          end
        `

        const client = adapter.client as {
          eval: (script: string, options: { keys: string[]; arguments: string[] }) => Promise<number>
        }
        const result = await client.eval(luaScript, {
          keys: [lockKey],
          arguments: [token, ttl.toString()],
        })

        return result === 1
      } else {
        // Fallback: non-atomic extend
        const redis = getRedisClient()
        const existing = await redis.get<string>(lockKey)
        if (existing === token) {
          // Re-set with new TTL
          await redis.set(lockKey, token, ttl)
          return true
        }
        return false
      }
    } catch (error) {
      console.error(`[RedisLock] Error extending lock for ${resource}:`, error)
      return false
    }
  }

  /**
   * Check if a resource is currently locked
   */
  async isLocked(resource: string): Promise<boolean> {
    const redis = getRedisClient()
    const lockKey = this.getLockKey(resource)

    try {
      const value = await redis.get<string>(lockKey)
      return value !== undefined && value !== null
    } catch {
      return false
    }
  }

  /**
   * Force release a lock (for admin/cleanup purposes)
   * WARNING: Use with caution - bypasses ownership check
   */
  async forceRelease(resource: string): Promise<boolean> {
    const redis = getRedisClient()
    const lockKey = this.getLockKey(resource)

    try {
      const deleted = await redis.delete(lockKey)
      console.log(`[RedisLock] Force released lock: ${resource}`)
      return deleted === true
    } catch (error) {
      console.error(`[RedisLock] Error force releasing lock for ${resource}:`, error)
      return false
    }
  }

  /**
   * Execute a function with a lock
   * Automatically acquires and releases the lock
   */
  async withLock<T>(
    resource: string,
    fn: () => Promise<T>,
    options: LockOptions = {}
  ): Promise<{ success: boolean; result?: T; error?: Error }> {
    const result = await this.acquire(resource, options)

    if (!result.acquired || !result.token) {
      return {
        success: false,
        error: new Error(`Failed to acquire lock for resource: ${resource}`),
      }
    }

    try {
      const fnResult = await fn()
      return { success: true, result: fnResult }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    } finally {
      await this.release(resource, result.token)
    }
  }
}

// Singleton instance
export const redisDistributedLock = new RedisDistributedLock()

/**
 * Helper function to execute operations with a distributed lock
 */
export async function withDistributedLock<T>(
  resource: string,
  fn: () => Promise<T>,
  options: LockOptions = {}
): Promise<{ success: boolean; result?: T; error?: Error }> {
  return redisDistributedLock.withLock(resource, fn, options)
}
