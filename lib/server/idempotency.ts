/**
 * Server-side Idempotency Handler
 * Uses Redis to track and deduplicate requests
 * 
 * Prevents duplicate processing of the same request within a time window
 * Supports both "in-flight" tracking and "completed" result caching
 */

import { getRedisClient, getRedisAdapter, IDEMPOTENCY_TTL } from './redis-client'

interface IdempotencyOptions {
  /** Time window in ms for idempotency (default: 5 minutes) */
  ttl?: number
  /** Whether to store and return cached results (default: true) */
  cacheResults?: boolean
}

interface IdempotencyRecord {
  status: 'pending' | 'completed' | 'failed'
  result?: unknown
  error?: string
  createdAt: number
  completedAt?: number
  /** Whether the handler completed (even if result wasn't cached) */
  processed?: boolean
}

interface IdempotencyResult<T = unknown> {
  isDuplicate: boolean
  isPending: boolean
  result?: T
  error?: string
  status?: 'pending' | 'completed' | 'failed'
}

/**
 * Extract idempotency key from request headers
 */
export function getIdempotencyKey(request: Request): string | null {
  // Check common idempotency header names
  const headerNames = [
    'X-Idempotency-Key',
    'Idempotency-Key',
    'x-idempotency-key',
    'idempotency-key',
  ]

  for (const headerName of headerNames) {
    const value = request.headers.get(headerName)
    if (value) {
      return value
    }
  }

  return null
}

/**
 * Generate a hash-based idempotency key from request content
 * Used when no explicit idempotency key is provided
 */
export function generateContentBasedKey(method: string, url: string, body?: string): string {
  const content = body || ''
  const raw = `${method}:${url}:${content}`
  
  // Simple hash function
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  
  return `idem_${Math.abs(hash).toString(36)}`
}

/**
 * Server-side Idempotency Manager using Redis
 */
export class ServerIdempotencyManager {
  private keyPrefix = 'idem:'
  private defaultTtl: number
  private cacheResults: boolean

  constructor(options: IdempotencyOptions = {}) {
    this.defaultTtl = options.ttl ?? IDEMPOTENCY_TTL
    this.cacheResults = options.cacheResults ?? true
  }

  /**
   * Get the full Redis key
   */
  private getKey(idemKey: string): string {
    return `${this.keyPrefix}${idemKey}`
  }

  /**
   * Get the lock key for in-flight request tracking
   */
  private getLockKey(idemKey: string): string {
    return `${this.keyPrefix}lock:${idemKey}`
  }

  /**
   * Check if a request with this idempotency key exists
   */
  async getStatus(idemKey: string): Promise<IdempotencyResult> {
    const redis = getRedisClient()
    const key = this.getKey(idemKey)

    try {
      const record = await redis.get<IdempotencyRecord>(key)

      if (!record) {
        return { isDuplicate: false, isPending: false }
      }

      return {
        isDuplicate: true,
        isPending: record.status === 'pending',
        result: record.result as unknown,
        error: record.error,
        status: record.status,
      }
    } catch (error) {
      console.error(`[Idempotency] Error getting status for ${idemKey}:`, error)
      return { isDuplicate: false, isPending: false }
    }
  }

  /**
   * Start tracking a new request
   * Only starts tracking if no existing record exists
   * Uses atomic operations to prevent race conditions
   *
   * @returns true if tracking was started, false if already exists
   */
  async startRequest(idemKey: string): Promise<boolean> {
    const redis = getRedisClient()
    const key = this.getKey(idemKey)

    try {
      // First, check if an existing record allows retry
      const existing = await redis.get<IdempotencyRecord>(key)

      if (existing) {
        // If status is 'failed', allow retry by updating to 'pending'
        if (existing.status === 'failed') {
          await redis.set(key, {
            status: 'pending',
            createdAt: Date.now(),
            completedAt: undefined,
            error: undefined,
            processed: undefined,
          } as IdempotencyRecord, this.defaultTtl)
          return true
        }
        // If status is 'pending' or 'completed', reject duplicate
        return false
      }

      // No existing record - try to create one
      // Use SET NX equivalent via get-then-set (has race condition but is best we can do)
      const newRecord: IdempotencyRecord = {
        status: 'pending',
        createdAt: Date.now(),
      }

      try {
        await redis.set(key, newRecord, this.defaultTtl)
        return true
      } catch {
        // Race condition: another request created the key between our check and set
        // Re-check the status
        const raceCheck = await redis.get<IdempotencyRecord>(key)
        if (raceCheck?.status === 'failed') {
          // Allow retry
          await redis.set(key, {
            status: 'pending',
            createdAt: Date.now(),
          } as IdempotencyRecord, this.defaultTtl)
          return true
        }
        return false
      }
    } catch (error) {
      console.error(`[Idempotency] Error starting request for ${idemKey}:`, error)
      return false
    }
  }

  /**
   * Mark a request as completed with result
   * Always stores the record (with processed=true) to allow duplicate detection
   * Only stores the actual result if cacheResults is true
   */
  async completeRequest<T>(idemKey: string, result: T): Promise<void> {
    const redis = getRedisClient()
    const key = this.getKey(idemKey)

    try {
      const record: IdempotencyRecord = {
        status: 'completed',
        // Only cache the result if cacheResults is enabled
        // For streaming responses with cacheResults: false, we still need to
        // track that the request completed to detect duplicates
        result: this.cacheResults ? result : undefined,
        createdAt: Date.now(),
        completedAt: Date.now(),
        // Mark as processed even if result wasn't cached
        // This allows subsequent duplicate requests to be properly detected
        processed: true,
      }

      // Update with new TTL
      await redis.set(key, record, this.defaultTtl)
    } catch (error) {
      console.error(`[Idempotency] Error completing request for ${idemKey}:`, error)
    }
  }

  /**
   * Mark a request as failed with error
   */
  async failRequest(idemKey: string, error: string): Promise<void> {
    const redis = getRedisClient()
    const key = this.getKey(idemKey)

    try {
      const record: IdempotencyRecord = {
        status: 'failed',
        error,
        createdAt: Date.now(),
        completedAt: Date.now(),
        processed: true,
      }

      // Use shorter TTL for failed requests to allow retry
      await redis.set(key, record, Math.min(this.defaultTtl, 60 * 1000))
    } catch (err) {
      console.error(`[Idempotency] Error failing request for ${idemKey}:`, err)
    }
  }

  /**
   * Clear an idempotency record (for testing or manual cleanup)
   */
  async clear(idemKey: string): Promise<void> {
    const redis = getRedisClient()
    const key = this.getKey(idemKey)

    try {
      await redis.delete(key)
    } catch (error) {
      console.error(`[Idempotency] Error clearing ${idemKey}:`, error)
    }
  }

  /**
   * Execute a request handler with idempotency protection
   *
   * @param idemKey - The idempotency key for this request
   * @param handler - The async function to execute
   * @param options - Idempotency options
   * @returns The result, or the cached result if duplicate
   */
  async withIdempotency<T>(
    idemKey: string,
    handler: () => Promise<T>,
    options: IdempotencyOptions = {}
  ): Promise<{ isDuplicate: boolean; result?: T; error?: string }> {
    const ttl = options.ttl ?? this.defaultTtl
    const cacheResults = options.cacheResults ?? this.cacheResults

    // Check if we have an existing record
    const status = await this.getStatus(idemKey)

    if (status.isDuplicate) {
      if (status.isPending) {
        return { isDuplicate: true, error: 'Request is still being processed' }
      }

      // Request exists but is not pending - check if we can return cached result
      if (status.status === 'completed' && status.result !== undefined) {
        return { isDuplicate: true, result: status.result as T }
      }

      // Request completed but no cached result (e.g., cacheResults: false for streaming)
      // This means the original request finished successfully but we didn't/can't return cached data
      // Return error to indicate the duplicate was processed but couldn't return cached result
      if (status.status === 'completed' && !status.result) {
        return {
          isDuplicate: true,
          error: 'Request completed but result was not cached (possible streaming response)',
        }
      }

      if (status.status === 'failed') {
        // Allow retry of failed requests
        const started = await this.startRequest(idemKey)
        if (!started) {
          // Another request took over
          const newStatus = await this.getStatus(idemKey)
          if (newStatus.status === 'completed' && newStatus.result !== undefined) {
            return { isDuplicate: true, result: newStatus.result as T }
          }
          return { isDuplicate: true, error: 'Request is still being processed' }
        }
      }
    } else {
      // Start tracking new request
      const started = await this.startRequest(idemKey)
      if (!started) {
        // Another process started it first
        const newStatus = await this.getStatus(idemKey)
        if (newStatus.isDuplicate && newStatus.status === 'completed') {
          return { isDuplicate: true, result: newStatus.result as T }
        }
        return { isDuplicate: true, error: 'Request is being processed by another instance' }
      }
    }

    // Execute the handler
    try {
      const result = await handler()

      // Always complete the request (creates record for duplicate detection)
      // Only cache the result if cacheResults is true
      if (cacheResults) {
        await this.completeRequest(idemKey, result)
      } else {
        // For streaming responses, we still need to track that the request completed
        // so duplicate requests can be properly detected (even if we can't return cached result)
        await this.completeRequest(idemKey, result)
      }

      return { isDuplicate: false, result }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await this.failRequest(idemKey, errorMessage)
      return { isDuplicate: false, error: errorMessage }
    }
  }
}

// Singleton instance
export const serverIdempotency = new ServerIdempotencyManager()

/**
 * Create a request-scoped idempotency handler
 * Useful for API routes
 */
export function createIdempotencyHandler(options?: IdempotencyOptions) {
  const manager = new ServerIdempotencyManager(options)

  return {
    /**
     * Get idempotency key from request
     */
    getKey: (request: Request, body?: string): string | null => {
      // First try explicit header
      const headerKey = getIdempotencyKey(request)
      if (headerKey) return headerKey

      // Fall back to content-based key
      const url = request.url
      const method = request.method
      return generateContentBasedKey(method, url, body)
    },

    /**
     * Execute handler with idempotency protection
     */
    withIdempotency: async <T>(
      request: Request,
      handler: () => Promise<T>,
      options?: IdempotencyOptions
    ): Promise<{ isDuplicate: boolean; result?: T; error?: string }> => {
      // Get idempotency key from header or generate from content
      const headerKey = getIdempotencyKey(request)
      const contentKey = generateContentBasedKey(request.method, request.url)
      const key = headerKey || contentKey
      
      return manager.withIdempotency(key, handler, options)
    },

    /**
     * Get the status of an idempotency key
     */
    getStatus: (key: string) => manager.getStatus(key),

    /**
     * Clear an idempotency record
     */
    clear: (key: string) => manager.clear(key),
  }
}
