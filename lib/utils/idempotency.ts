/**
 * Idempotency handling utilities
 * Prevents duplicate API requests using client-side request deduplication
 */

/**
 * In-flight request tracker to prevent duplicate concurrent requests
 */
class IdempotencyTracker {
  private pendingRequests: Map<string, Promise<unknown>> = new Map()
  private requestHistory: Map<string, { timestamp: number; key: string }> = new Map()
  private readonly HISTORY_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_HISTORY_SIZE = 100

  /**
   * Generate a unique idempotency key for a request
   * The key is based only on the request content (method, endpoint, data)
   * to ensure the same request always generates the same key
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
    // Return key WITHOUT timestamp to ensure idempotency across time
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
    request.finally(() => {
      this.pendingRequests.delete(key)
      this.addToHistory(key)
    })

    return request
  }

  /**
   * Add a completed request to history for deduplication
   */
  private addToHistory(key: string): void {
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
    console.log(`[Idempotency] Reusing in-flight request: ${key}`)
    return existing
  }

  const request = requestFactory()
  return idempotencyTracker.trackRequest(key, request)
}

/**
 * Result type for idempotent requests
 */
export interface IdempotentResult<T> {
  /** Whether this was a cached response from a duplicate request */
  isCached: boolean
  /** The result value (undefined if isCached is false and no result yet) */
  value?: T
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
): Promise<IdempotentResult<T>> {
  const { deduplicateConcurrent = true } = options
  const key = idempotencyTracker.generateKey(endpoint, method, data)

  // Only check for duplicates if deduplication is enabled
  if (deduplicateConcurrent) {
    // Check if request was recently completed
    if (idempotencyTracker.wasRecentlyCompleted(key)) {
      console.log(`[Idempotency] Request already completed recently: ${key}`)
      // Return cached indicator - caller can use this to avoid refetching
      return { isCached: true }
    }

    if (idempotencyTracker.isRequestPending(key)) {
      console.log(`[Idempotency] Request already in-flight: ${key}`)
      const existing = idempotencyTracker.getPendingRequest<T>(key)
      if (existing) {
        const result = await existing
        return { isCached: false, value: result }
      }
    }
  }

  const result = await idempotencyTracker.trackRequest(key, requestFactory())
  return { isCached: false, value: result }
}
