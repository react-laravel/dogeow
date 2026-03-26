/**
 * Server-side Redis client singleton
 * Provides a centralized Redis connection for distributed locking and caching
 */

import { createKeyv, KeyvRedis } from '@keyv/redis'
import Keyv from 'keyv'

// Redis connection URL - uses environment variable or defaults to localhost
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// TTL defaults
export const DEFAULT_TTL = 30 * 1000 // 30 seconds
export const IDEMPOTENCY_TTL = 5 * 60 * 1000 // 5 minutes
export const LOCK_TTL = 60 * 1000 // 60 seconds

/**
 * Create and configure the Redis client
 */
function createRedisClient(): Keyv {
  const client = createKeyv(REDIS_URL, {
    namespace: 'dogeow',
  })

  client.on('error', (err: Error) => {
    console.error('[Redis Client] Connection error:', err)
  })

  client.on('ready', () => {
    console.log('[Redis Client] Connected to Redis at', REDIS_URL)
  })

  return client
}

// Singleton instance
let redisClient: Keyv | null = null

/**
 * Get the Redis client singleton
 * Initializes connection on first access
 */
export function getRedisClient(): Keyv {
  if (!redisClient) {
    redisClient = createRedisClient()
  }
  return redisClient
}

/**
 * Get the underlying KeyvRedis adapter for advanced operations
 * (e.g., accessing the raw Redis client for Lua scripts)
 */
export function getRedisAdapter(): KeyvRedis | undefined {
  const client = getRedisClient()
  return client.store as KeyvRedis | undefined
}

/**
 * Close the Redis connection
 * Call this during graceful shutdown
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.disconnect()
    redisClient = null
    console.log('[Redis Client] Disconnected')
  }
}

/**
 * Health check for Redis connection
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    const client = getRedisClient()
    await client.get('__health_check__')
    return true
  } catch {
    return false
  }
}
