/**
 * Idempotency handling utilities
 * Prevents duplicate API requests using client-side request deduplication
 * Supports both in-memory and Redis-backed storage for distributed environments
 */

import { loadOptionalNodeModule } from './optional-node-module'
import { logger } from '@/lib/logger'

// Redis client types (will be loaded dynamically)
interface RedisClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ...args: Array<string | number>): Promise<'OK' | null>
  del(key: string): Promise<number>
  eval(script: string, numKeys: number, ...args: Array<string | number>): Promise<unknown>
  ping(): Promise<string>
}

type RedisConstructor = new (
  url: string,
  options: {
    maxRetriesPerRequest: number
    retryStrategy: (times: number) => number | null
    lazyConnect: boolean
  }
) => RedisClient & { ping(): Promise<string> }
type RedisModule = RedisConstructor | { default: RedisConstructor }

let redisClient: RedisClient | null = null
let redisAvailable = false
const IDEMPOTENCY_KEY_PREFIX = 'idempotency:'

/**
 * Initialize Redis client
 */
async function initRedisClient(): Promise<boolean> {
  if (redisClient) {
    return redisAvailable
  }

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    logger.debug('[Idempotency] No REDIS_URL configured, using in-memory storage')
    return false
  }

  try {
    const redisModule = loadOptionalNodeModule<RedisModule>('ioredis')
    const Redis: RedisConstructor | null = !redisModule
      ? null
      : typeof redisModule === 'function'
        ? redisModule
        : redisModule.default

    if (!Redis) {
      logger.debug('[Idempotency] Node runtime module loader unavailable, using in-memory storage')
      return false
    }

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null
        return Math.min(times * 100, 3000)
      },
      lazyConnect: true,
    }) as unknown as RedisClient

    await redisClient.ping()
    redisAvailable = true
    logger.debug('[Idempotency] Redis connection established')
    return true
  } catch (error) {
    logger.warn(
      '[Idempotency] Redis unavailable, using in-memory storage:',
      error instanceof Error ? error.message : error
    )
    redisClient = null
    redisAvailable = false
    return false
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redisAvailable
}

/**
 * In-flight request tracker to prevent duplicate concurrent requests
 * Supports both in-memory and Redis-backed storage
 */
class IdempotencyTracker {
  private pendingRequests: Map<string, Promise<unknown>> = new Map()
  private requestHistory: Map<string, { timestamp: number; key: string; result?: unknown }> =
    new Map()
  private readonly HISTORY_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_HISTORY_SIZE = 100
  private redisInitialized: boolean = false

  /**
   * Initialize Redis if not already done
   */
  private async ensureRedisInitialized(): Promise<void> {
    if (this.redisInitialized) return
    this.redisInitialized = true
    await initRedisClient()
  }

  /**
   * Generate a unique idempotency key for a request
   * The key is based on endpoint, method, and payload only - not timestamp
   * This ensures the same request made at different times gets the same key
   */
  generateKey(endpoint: string, method: string, data?: unknown): string {
    const payload = data ? JSON.stringify(data) : ''
    // Use a hash-like combination for the key
    const raw = `${method}:${endpoint}:${payload}`
    // Simple hash function to create a consistent key
    let hash = 0
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return `idempotent_${Math.abs(hash).toString(36)}`
  }

  /**
   * Check if a request with the same signature is already in-flight
   */
  isRequestPending(key: string): boolean {
    return this.pendingRequests.has(key)
  }

  /**
   * Get an existing in-flight request
   */
  getPendingRequest<T>(key: string): Promise<T> | undefined {
    return this.pendingRequests.get(key) as Promise<T> | undefined
  }

  /**
   * Track a new in-flight request
   * Returns a function to call when the request completes
   */
  trackRequest<T>(key: string, request: Promise<T>): Promise<T> {
    // If already tracking this exact key, return the existing promise
    const existing = this.pendingRequests.get(key)
    if (existing) {
      return existing as Promise<T>
    }

    this.pendingRequests.set(key, request as Promise<unknown>)

    // Clean up when request completes
    request
      .then(result => {
        this.pendingRequests.delete(key)
        this.addToHistory(key, result)
        return result
      })
      .catch(() => {
        this.pendingRequests.delete(key)
        this.addToHistory(key)
      })

    return request
  }

  /**
   * Add a completed request to history for deduplication
   */
  private addToHistory(key: string, result?: unknown): void {
    // Cleanup old entries
    this.cleanupHistory()

    if (this.requestHistory.size >= this.MAX_HISTORY_SIZE) {
      // Remove oldest entry
      const oldestKey = this.requestHistory.keys().next().value
      if (oldestKey) {
        this.requestHistory.delete(oldestKey)
      }
    }

    this.requestHistory.set(key, {
      timestamp: Date.now(),
      key,
      result,
    })
  }

  /**
   * Check if a request was recently completed
   */
  wasRecentlyCompleted(key: string): boolean {
    const entry = this.requestHistory.get(key)
    if (!entry) return false

    const isExpired = Date.now() - entry.timestamp > this.HISTORY_TTL
    if (isExpired) {
      this.requestHistory.delete(key)
      return false
    }

    return true
  }

  /**
   * Get the cached result of a recently completed request
   */
  getRecentResult<T>(key: string): T | undefined {
    const entry = this.requestHistory.get(key)
    if (!entry) return undefined

    const isExpired = Date.now() - entry.timestamp > this.HISTORY_TTL
    if (isExpired) {
      this.requestHistory.delete(key)
      return undefined
    }

    return entry.result as T | undefined
  }

  /**
   * Remove expired entries from history
   */
  private cleanupHistory(): void {
    const now = Date.now()
    for (const [key, entry] of this.requestHistory.entries()) {
      if (now - entry.timestamp > this.HISTORY_TTL) {
        this.requestHistory.delete(key)
      }
    }
  }

  /**
   * Clear all tracked requests (useful for testing)
   */
  reset(): void {
    this.pendingRequests.clear()
    this.requestHistory.clear()
  }

  /**
   * Check Redis for an existing completed request (for distributed environments)
   */
  async checkRedisForCompleted(key: string): Promise<{ completed: boolean; result?: unknown }> {
    await this.ensureRedisInitialized()
    if (!redisClient || !redisAvailable) {
      return { completed: false }
    }

    try {
      const redisKey = `${IDEMPOTENCY_KEY_PREFIX}${key}`
      const value = await redisClient.get(redisKey)
      if (value) {
        const parsed = JSON.parse(value)
        const isExpired = Date.now() - parsed.timestamp > this.HISTORY_TTL
        if (isExpired) {
          await redisClient.del(redisKey)
          return { completed: false }
        }
        return { completed: true, result: parsed.result }
      }
    } catch (error) {
      logger.warn(
        '[Idempotency] Redis check failed:',
        error instanceof Error ? error.message : error
      )
    }

    return { completed: false }
  }

  /**
   * Store result in Redis for distributed idempotency
   */
  async storeToRedis(key: string, result: unknown): Promise<void> {
    await this.ensureRedisInitialized()
    if (!redisClient || !redisAvailable) {
      return
    }

    try {
      const redisKey = `${IDEMPOTENCY_KEY_PREFIX}${key}`
      const value = JSON.stringify({
        result,
        timestamp: Date.now(),
      })
      // Store with TTL slightly longer than HISTORY_TTL to allow for cleanup
      await redisClient.set(redisKey, value, 'PX', this.HISTORY_TTL + 60000)
    } catch (error) {
      logger.warn(
        '[Idempotency] Redis store failed:',
        error instanceof Error ? error.message : error
      )
    }
  }

  /**
   * Try to acquire an idempotency lock in Redis (for distributed duplicate submission prevention)
   * Returns true if this is the first request with this key
   */
  async tryAcquireIdempotencyLock(key: string, ttl: number = 30000): Promise<boolean> {
    await this.ensureRedisInitialized()
    if (!redisClient || !redisAvailable) {
      // Fall back to in-memory check
      if (this.isRequestPending(key) || this.wasRecentlyCompleted(key)) {
        return false
      }
      return true
    }

    try {
      const redisKey = `${IDEMPOTENCY_KEY_PREFIX}lock:${key}`
      // Try to set only if not exists (NX) with expiration (PX)
      const result = await redisClient.set(redisKey, Date.now().toString(), 'NX', 'PX', ttl)
      return result === 'OK'
    } catch (error) {
      logger.warn(
        '[Idempotency] Redis lock acquisition failed:',
        error instanceof Error ? error.message : error
      )
      // Fall back to in-memory
      return !this.isRequestPending(key) && !this.wasRecentlyCompleted(key)
    }
  }

  /**
   * Release idempotency lock in Redis
   */
  async releaseIdempotencyLock(key: string): Promise<void> {
    await this.ensureRedisInitialized()
    if (!redisClient || !redisAvailable) {
      return
    }

    try {
      const redisKey = `${IDEMPOTENCY_KEY_PREFIX}lock:${key}`
      await redisClient.del(redisKey)
    } catch (error) {
      logger.warn(
        '[Idempotency] Redis lock release failed:',
        error instanceof Error ? error.message : error
      )
    }
  }
}

// Singleton instance
export const idempotencyTracker = new IdempotencyTracker()

/**
 * Generate a unique request ID for idempotency headers
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Deduplicate concurrent requests
 * If the same request is already in-flight, return that promise instead of making a new one
 */
export function deduplicateRequest<T>(key: string, requestFactory: () => Promise<T>): Promise<T> {
  const existing = idempotencyTracker.getPendingRequest<T>(key)
  if (existing) {
    logger.debug(`[Idempotency] Reusing in-flight request: ${key}`)
    return existing
  }

  const request = requestFactory()
  return idempotencyTracker.trackRequest(key, request)
}

/**
 * Execute a request with idempotency protection
 * Prevents duplicate submissions within a time window
 */
export async function withIdempotency<T>(
  endpoint: string,
  method: string,
  data: unknown,
  requestFactory: () => Promise<T>,
  options: { deduplicateConcurrent?: boolean; timeWindow?: number } = {}
): Promise<T> {
  const { deduplicateConcurrent = true } = options
  const key = idempotencyTracker.generateKey(endpoint, method, data)

  // Check if request was recently completed - return cached result if so
  if (idempotencyTracker.wasRecentlyCompleted(key)) {
    logger.debug(`[Idempotency] Request already completed recently: ${key}`)
    const cachedResult = idempotencyTracker.getRecentResult<T>(key)
    if (cachedResult !== undefined) {
      return cachedResult
    }
  }

  if (deduplicateConcurrent && idempotencyTracker.isRequestPending(key)) {
    logger.debug(`[Idempotency] Request already in-flight: ${key}`)
    const existing = idempotencyTracker.getPendingRequest<T>(key)
    if (existing) return existing
  }

  return idempotencyTracker.trackRequest(key, requestFactory())
}

/**
 * Result of an idempotent operation
 */
export interface IdempotentResult<T> {
  success: boolean
  result?: T
  error?: Error
  isDuplicate?: boolean
  requestId?: string
}

/**
 * Execute a request with idempotency protection AND distributed locking
 * This combines duplicate submission prevention with exclusive lock protection
 * Best for critical API operations that modify data
 *
 * @param endpoint - API endpoint for key generation
 * @param method - HTTP method
 * @param data - Request payload
 * @param requestFactory - Function that executes the actual request
 * @param options - Configuration options
 */
export async function withIdempotencyAndLock<T>(
  endpoint: string,
  method: string,
  data: unknown,
  requestFactory: () => Promise<T>,
  options: {
    lockTtl?: number
    idempotencyTtl?: number
    onDuplicate?: (existingResult: unknown) => void
  } = {}
): Promise<IdempotentResult<T>> {
  const { lockTtl = 30000, idempotencyTtl = 30000, onDuplicate } = options
  const requestId = generateRequestId()
  const key = idempotencyTracker.generateKey(endpoint, method, data)

  // First, try to acquire the idempotency lock to prevent duplicate submissions
  const lockAcquired = await idempotencyTracker.tryAcquireIdempotencyLock(key, idempotencyTtl)

  if (!lockAcquired) {
    // Another request with the same key is in progress or recently completed
    // Check if there's a cached result we can return
    const cachedResult = idempotencyTracker.getRecentResult<T>(key)
    if (cachedResult !== undefined) {
      logger.debug(
        `[IdempotencyAndLock] Duplicate request detected, returning cached result: ${key}`
      )
      onDuplicate?.(cachedResult)
      return {
        success: true,
        result: cachedResult,
        isDuplicate: true,
        requestId,
      }
    }

    // Also check Redis for completed result in distributed environment
    const redisCheck = await idempotencyTracker.checkRedisForCompleted(key)
    if (redisCheck.completed && redisCheck.result !== undefined) {
      logger.debug(
        `[IdempotencyAndLock] Duplicate request detected (from Redis), returning cached result: ${key}`
      )
      onDuplicate?.(redisCheck.result)
      return {
        success: true,
        result: redisCheck.result as T,
        isDuplicate: true,
        requestId,
      }
    }

    // Request is still in progress, wait for it
    const existingRequest = idempotencyTracker.getPendingRequest<T>(key)
    if (existingRequest) {
      logger.debug(`[IdempotencyAndLock] Request in progress, waiting: ${key}`)
      try {
        const result = await existingRequest
        return {
          success: true,
          result,
          isDuplicate: true,
          requestId,
        }
      } catch (error) {
        // The in-progress request failed, allow retry
        logger.warn(`[IdempotencyAndLock] Previous request failed, allowing retry: ${key}`)
      }
    }
  }

  // We have the lock, proceed with the request
  try {
    // Track the request
    const trackedRequest = idempotencyTracker.trackRequest(key, requestFactory())

    // Execute the request
    const result = await trackedRequest

    // Store result for future duplicate detection
    idempotencyTracker.storeToRedis(key, result)

    return {
      success: true,
      result,
      isDuplicate: false,
      requestId,
    }
  } catch (error) {
    // Release the lock on error so retries can work
    await idempotencyTracker.releaseIdempotencyLock(key)
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      isDuplicate: false,
      requestId,
    }
  } finally {
    // Release the idempotency lock
    await idempotencyTracker.releaseIdempotencyLock(key)
  }
}

/**
 * Error class for duplicate submission attempts
 */
export class DuplicateSubmissionError extends Error {
  public readonly requestId: string
  public readonly originalRequestId?: string

  constructor(message: string, requestId: string, originalRequestId?: string) {
    super(message)
    this.name = 'DuplicateSubmissionError'
    this.requestId = requestId
    this.originalRequestId = originalRequestId
  }
}
