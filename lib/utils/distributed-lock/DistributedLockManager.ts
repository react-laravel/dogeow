import { LockAcquisitionError } from './errors'
import { getRedisClient, initRedisClient, isRedisAvailable } from './redis-client'
import {
  acquireRedis,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_INTERVAL,
  DEFAULT_TTL,
  type LockOptions,
  releaseRedis,
} from './redis-lock'

interface LockEntry {
  key: string
  token: string
  expiresAt: number
  owner: string
}

/**
 * Distributed Lock Manager
 * Supports both Redis-backed distributed locks and in-memory fallback
 */
export class DistributedLockManager {
  private locks: Map<string, LockEntry> = new Map()
  private instanceId: string
  private cleanupInterval: NodeJS.Timeout | null = null
  private useRedis: boolean = true
  private redisInitialized: boolean = false

  constructor() {
    // Generate unique instance ID for this client
    this.instanceId = `client_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`

    // Start cleanup interval to remove expired locks (only for in-memory mode)
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanupExpired(), 5000)
    }
  }

  /**
   * Initialize Redis connection
   */
  private async ensureRedisInitialized(): Promise<void> {
    if (this.redisInitialized) return
    this.redisInitialized = true
    await initRedisClient()
  }

  /**
   * Generate a unique lock token
   */
  private generateToken(): string {
    return `lock_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * Check if a lock is expired
   */
  private isLockExpired(lock: LockEntry): boolean {
    return Date.now() > lock.expiresAt
  }

  /**
   * Clean up all expired locks
   */
  private cleanupExpired(): void {
    for (const [key, lock] of this.locks.entries()) {
      if (this.isLockExpired(lock)) {
        this.locks.delete(key)
        this.log('cleanup', `Removed expired lock: ${key}`)
      }
    }
  }

  /**
   * Log lock operations (only in development)
   */
  private log(operation: string, message: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DistributedLock:${operation}] ${message}`)
    }
  }

  private getRedisLockContext() {
    return {
      instanceId: this.instanceId,
      ensureInitialized: () => this.ensureRedisInitialized(),
      log: (operation: string, message: string) => this.log(operation, message),
      generateToken: () => this.generateToken(),
    }
  }

  /**
   * Attempt to acquire a lock
   * Returns true if lock was acquired, false otherwise
   * isFresh indicates if this was a new acquisition (vs a refresh of existing lock)
   */
  async acquire(
    resource: string,
    options: LockOptions = {}
  ): Promise<{ acquired: boolean; token?: string; isFresh?: boolean }> {
    const { useRedis = true, verbose = process.env.NODE_ENV === 'development' } = options

    // Try Redis first if enabled and available
    if (useRedis !== false) {
      await this.ensureRedisInitialized()
      if (isRedisAvailable() && getRedisClient()) {
        const redisResult = await acquireRedis(resource, options, this.getRedisLockContext())
        if (redisResult.acquired) {
          return redisResult
        }
        // If Redis failed to acquire, fall back to in-memory
        // But only if we haven't exhausted retries
      }
    }

    // Fall back to in-memory lock
    const {
      ttl = DEFAULT_TTL,
      retryInterval = DEFAULT_RETRY_INTERVAL,
      maxRetries = DEFAULT_MAX_RETRIES,
    } = options
    const lockKey = `lock:${resource}`
    const token = this.generateToken()

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const existingLock = this.locks.get(lockKey)

      // Check if lock exists and is not expired
      if (existingLock) {
        if (this.isLockExpired(existingLock)) {
          // Lock is expired, remove it
          this.locks.delete(lockKey)
          this.log('acquire', `Lock expired, removing: ${lockKey}`)
        } else if (existingLock.owner === this.instanceId) {
          // Same instance already owns this lock - refresh it but indicate not fresh
          existingLock.expiresAt = Date.now() + ttl
          this.log('acquire', `Refreshed existing lock: ${lockKey}`)
          return { acquired: true, token: existingLock.token, isFresh: false }
        } else {
          // Another instance holds the lock
          if (verbose) {
            this.log(
              'acquire',
              `Lock held by another client: ${lockKey} (attempt ${attempt + 1}/${maxRetries + 1})`
            )
          }
        }
      } else {
        // No lock exists, try to acquire
        const newLock: LockEntry = {
          key: lockKey,
          token,
          expiresAt: Date.now() + ttl,
          owner: this.instanceId,
        }

        this.locks.set(lockKey, newLock)
        this.log('acquire', `Lock acquired: ${lockKey} with token ${token}`)
        return { acquired: true, token, isFresh: true }
      }

      // Wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryInterval))
      }
    }

    this.log('acquire', `Failed to acquire lock after ${maxRetries + 1} attempts: ${lockKey}`)
    return { acquired: false }
  }

  /**
   * Release a lock
   * Only releases if the token matches (simulating Redis DEL with token check)
   */
  async release(resource: string, token: string): Promise<boolean> {
    const lockKey = `lock:${resource}`

    // Try Redis first if available
    await this.ensureRedisInitialized()
    if (isRedisAvailable() && getRedisClient()) {
      return releaseRedis(resource, token, {
        log: (operation, message) => this.log(operation, message),
      })
    }

    // Fall back to in-memory
    const lock = this.locks.get(lockKey)

    if (!lock) {
      this.log('release', `Lock not found: ${lockKey}`)
      return true // Lock doesn't exist, consider it released
    }

    if (lock.token !== token) {
      this.log('release', `Token mismatch for ${lockKey}: expected ${lock.token}, got ${token}`)
      return false // Token doesn't match, can't release
    }

    if (lock.owner !== this.instanceId) {
      this.log('release', `Not the owner of lock: ${lockKey}`)
      return false // Not the owner
    }

    this.locks.delete(lockKey)
    this.log('release', `Lock released: ${lockKey}`)
    return true
  }

  /**
   * Check if a resource is locked (in-memory only, for backward compatibility)
   * Use isLockedAsync for Redis-backed check in distributed environments
   */
  isLocked(resource: string): boolean {
    const lockKey = `lock:${resource}`

    // In-memory check
    const lock = this.locks.get(lockKey)
    if (!lock) return false
    if (this.isLockExpired(lock)) {
      this.locks.delete(lockKey)
      return false
    }
    return true
  }

  /**
   * Check if a resource is locked (async, with Redis support)
   */
  async isLockedAsync(resource: string): Promise<boolean> {
    const lockKey = `lock:${resource}`

    // Try Redis first if available
    await this.ensureRedisInitialized()
    const redisClient = getRedisClient()
    if (isRedisAvailable() && redisClient) {
      try {
        const value = await redisClient.get(lockKey)
        return value !== null
      } catch {
        // Fall back to in-memory
      }
    }

    // In-memory check
    return this.isLocked(resource)
  }

  /**
   * Force release a lock (for admin/cleanup purposes)
   * WARNING: Use with caution, bypasses ownership check
   */
  forceRelease(resource: string): boolean {
    const lockKey = `lock:${resource}`
    const existed = this.locks.has(lockKey)
    this.locks.delete(lockKey)

    // Also try to release from Redis
    const redisClient = getRedisClient()
    if (redisClient) {
      redisClient.del(lockKey).catch(() => {})
    }

    if (existed) {
      this.log('forceRelease', `Force released lock: ${lockKey}`)
    }
    return existed
  }

  /**
   * Extend lock TTL
   * Only works if the token matches
   */
  async extend(resource: string, token: string, ttl: number = DEFAULT_TTL): Promise<boolean> {
    const lockKey = `lock:${resource}`

    // Try Redis first if available
    await this.ensureRedisInitialized()
    const redisClient = getRedisClient()
    if (isRedisAvailable() && redisClient) {
      try {
        const current = await redisClient.get(lockKey)
        if (current === token) {
          await redisClient.set(lockKey, token, 'PX', ttl)
          this.log('extend:redis', `Extended lock: ${lockKey}`)
          return true
        }
        return false
      } catch {
        // Fall back to in-memory
      }
    }

    // In-memory extend
    const lock = this.locks.get(lockKey)
    if (!lock) {
      this.log('extend', `Lock not found: ${lockKey}`)
      return false
    }

    if (lock.token !== token) {
      this.log('extend', `Token mismatch for ${lockKey}`)
      return false
    }

    if (lock.owner !== this.instanceId) {
      this.log('extend', `Not the owner of lock: ${lockKey}`)
      return false
    }

    lock.expiresAt = Date.now() + ttl
    this.log('extend', `Extended lock: ${lockKey} until ${new Date(lock.expiresAt).toISOString()}`)
    return true
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
    const acquireResult = await this.acquire(resource, options)

    // If lock wasn't acquired, treat as failure
    if (!acquireResult.acquired || !acquireResult.token) {
      const error = new LockAcquisitionError(resource, options.maxRetries ?? DEFAULT_MAX_RETRIES)
      return {
        success: false,
        error,
      }
    }

    const token = acquireResult.token
    try {
      const fnResult = await fn()
      return { success: true, result: fnResult }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    } finally {
      // Ensure lock is always released, even if function throws
      const released = await this.release(resource, token)
      if (!released) {
        console.warn(`[DistributedLock] Lock release may have failed for: ${resource}`)
      }
    }
  }

  /**
   * Get all current locks (for debugging)
   */
  getLocks(): Array<{ resource: string; owner: string; expiresAt: Date; expired: boolean }> {
    const locks: Array<{ resource: string; owner: string; expiresAt: Date; expired: boolean }> = []

    for (const [key, lock] of this.locks.entries()) {
      const resource = key.replace('lock:', '')
      locks.push({
        resource,
        owner: lock.owner,
        expiresAt: new Date(lock.expiresAt),
        expired: this.isLockExpired(lock),
      })
    }

    return locks
  }

  /**
   * Clear all locks (for testing)
   */
  reset(): void {
    this.locks.clear()
    this.log('reset', 'All locks cleared')
  }

  /**
   * Cleanup method to stop the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.locks.clear()
  }
}

// Singleton instance
export const distributedLock = new DistributedLockManager()

/**
 * Decorator-like wrapper for executing functions with lock protection
 */
export function withDistributedLock<T extends (...args: unknown[]) => unknown>(
  resource: string,
  options: LockOptions = {}
) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as T

    descriptor.value = async function (...args: Parameters<T>): Promise<ReturnType<T>> {
      const result = await distributedLock.withLock(
        resource,
        async () => originalMethod.apply(this, args) as Awaited<ReturnType<T>>,
        options
      )

      if (!result.success) {
        throw result.error
      }

      return result.result as ReturnType<T>
    }

    return descriptor
  }
}
