import { loadOptionalNodeModule } from '../optional-node-module'

// Redis client types (will be loaded dynamically)
export interface RedisClient {
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

/**
 * Initialize Redis client
 * Returns true if Redis is available
 */
export async function initRedisClient(): Promise<boolean> {
  if (redisClient) {
    return redisAvailable
  }

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    console.log('[DistributedLock] No REDIS_URL configured, using in-memory locks')
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
      console.log('[DistributedLock] Node runtime module loader unavailable, using in-memory locks')
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
    console.log('[DistributedLock] Redis connection established')
    return true
  } catch (error) {
    console.warn(
      '[DistributedLock] Redis unavailable, using in-memory locks:',
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
 * Get the initialized Redis client (null if unavailable)
 */
export function getRedisClient(): RedisClient | null {
  return redisClient
}
