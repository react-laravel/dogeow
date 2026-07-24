import { getRedisClient } from './redis-client'

export interface LockOptions {
  /** Time in ms before lock automatically expires (default: 30000) */
  ttl?: number
  /** Time in ms between lock acquisition retry attempts (default: 100) */
  retryInterval?: number
  /** Maximum number of retry attempts (default: 50) */
  maxRetries?: number
  /** If true, logs lock operations (default: true in development) */
  verbose?: boolean
  /** Use Redis for distributed locking if available (default: true) */
  useRedis?: boolean
}

export const DEFAULT_TTL = 30 * 1000 // 30 seconds
export const DEFAULT_RETRY_INTERVAL = 100 // 100ms
export const DEFAULT_MAX_RETRIES = 50 // 5 seconds total

export type LockLogFn = (operation: string, message: string) => void

export interface RedisLockContext {
  instanceId: string
  ensureInitialized: () => Promise<void>
  log: LockLogFn
  generateToken: () => string
}

/**
 * Acquire lock using Redis (Redlock-style algorithm)
 */
export async function acquireRedis(
  resource: string,
  options: LockOptions,
  context: RedisLockContext
): Promise<{ acquired: boolean; token?: string; isFresh?: boolean }> {
  await context.ensureInitialized()
  const redisClient = getRedisClient()
  if (!redisClient) {
    return { acquired: false }
  }

  const {
    ttl = DEFAULT_TTL,
    retryInterval = DEFAULT_RETRY_INTERVAL,
    maxRetries = DEFAULT_MAX_RETRIES,
    verbose = process.env.NODE_ENV === 'development',
  } = options
  const lockKey = `lock:${resource}`
  const token = context.generateToken()

  // Lua script for atomic lock acquisition with token check
  const acquireScript = `
      local key = KEYS[1]
      local token = ARGV[1]
      local ttl = tonumber(ARGV[2])
      local current = redis.call('GET', key)
      if current then
        return current
      end
      redis.call('SET', key, token, 'PX', ttl)
      return nil
    `

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const existingToken = await redisClient.get(lockKey)

      if (existingToken) {
        if (existingToken === context.instanceId) {
          // Same instance holds the lock - refresh it
          await redisClient.set(lockKey, context.instanceId, 'PX', ttl)
          context.log('acquire:redis', `Refreshed existing lock: ${lockKey}`)
          return { acquired: true, token: existingToken, isFresh: false }
        }
        // Another instance holds the lock
        if (verbose) {
          context.log(
            'acquire:redis',
            `Lock held by another client: ${lockKey} (attempt ${attempt + 1}/${maxRetries + 1})`
          )
        }
      } else {
        // Try to acquire
        const result = (await redisClient.eval(
          acquireScript,
          1,
          lockKey,
          context.instanceId,
          ttl
        )) as string | null
        if (result === null) {
          context.log('acquire:redis', `Lock acquired: ${lockKey} with token ${context.instanceId}`)
          return { acquired: true, token: context.instanceId, isFresh: true }
        }
        if (result === context.instanceId) {
          return { acquired: true, token: context.instanceId, isFresh: false }
        }
      }
    } catch (error) {
      context.log('acquire:redis', `Error: ${error instanceof Error ? error.message : error}`)
    }

    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryInterval))
    }
  }

  context.log(
    'acquire:redis',
    `Failed to acquire lock after ${maxRetries + 1} attempts: ${lockKey}`
  )
  return { acquired: false }
}

/**
 * Release lock using Redis
 */
export async function releaseRedis(
  resource: string,
  token: string,
  context: { log: LockLogFn }
): Promise<boolean> {
  const redisClient = getRedisClient()
  if (!redisClient) return false

  const lockKey = `lock:${resource}`

  // Lua script for atomic lock release with token check
  const releaseScript = `
      local key = KEYS[1]
      local token = ARGV[1]
      local current = redis.call('GET', key)
      if current == token then
        redis.call('DEL', key)
        return 1
      end
      return 0
    `

  try {
    const result = (await redisClient.eval(releaseScript, 1, lockKey, token)) as number
    if (result === 1) {
      context.log('release:redis', `Lock released: ${lockKey}`)
      return true
    }
    context.log('release:redis', `Token mismatch or lock not found: ${lockKey}`)
    return false
  } catch (error) {
    context.log('release:redis', `Release error: ${error instanceof Error ? error.message : error}`)
    return false
  }
}
