/**
 * Distributed Lock simulation for client-side operations
 * Simulates Redis distributed lock behavior for critical sections
 *
 * Note: This is a CLIENT-SIDE lock implementation. For true distributed locking
 * across multiple servers/tabs, a server-side Redis lock is required.
 * This implementation helps prevent duplicate submissions within a single
 * browser session and provides a foundation for server-side lock integration.
 */

interface LockOptions {
  /** Time in ms before lock automatically expires (default: 30000) */
  ttl?: number
  /** Time in ms between lock acquisition retry attempts (default: 100) */
  retryInterval?: number
  /** Maximum number of retry attempts (default: 50) */
  maxRetries?: number
  /** If true, logs lock operations (default: true in development) */
  verbose?: boolean
}

interface LockEntry {
  key: string
  token: string
  expiresAt: number
  owner: string
}

const DEFAULT_TTL = 30 * 1000 // 30 seconds
const DEFAULT_RETRY_INTERVAL = 100 // 100ms
const DEFAULT_MAX_RETRIES = 50 // 5 seconds total

/**
 * Distributed Lock Manager
 * Simulates Redis-like locking behavior on the client side
 */
class DistributedLockManager {
  private locks: Map<string, LockEntry> = new Map()
  private instanceId: string
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Generate unique instance ID for this client
    this.instanceId = `client_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`

    // Start cleanup interval to remove expired locks
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanupExpired(), 5000)
    }
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

  /**
   * Attempt to acquire a lock
   * Returns true if lock was acquired, false otherwise
   */
  async acquire(
    resource: string,
    options: LockOptions = {}
  ): Promise<{ acquired: boolean; token?: string }> {
    const {
      ttl = DEFAULT_TTL,
      retryInterval = DEFAULT_RETRY_INTERVAL,
      maxRetries = DEFAULT_MAX_RETRIES,
      verbose = process.env.NODE_ENV === 'development',
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
          // Same instance already owns this lock - refresh it
          existingLock.expiresAt = Date.now() + ttl
          this.log('acquire', `Refreshed existing lock: ${lockKey}`)
          return { acquired: true, token: existingLock.token }
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
        return { acquired: true, token }
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
   * Check if a resource is locked
   */
  isLocked(resource: string): boolean {
    const lockKey = `lock:${resource}`
    const lock = this.locks.get(lockKey)

    if (!lock) return false
    if (this.isLockExpired(lock)) {
      this.locks.delete(lockKey)
      return false
    }

    return true
  }

  /**
   * Force release a lock (for admin/cleanup purposes)
   * WARNING: Use with caution, bypasses ownership check
   */
  forceRelease(resource: string): boolean {
    const lockKey = `lock:${resource}`
    const existed = this.locks.has(lockKey)
    this.locks.delete(lockKey)
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
