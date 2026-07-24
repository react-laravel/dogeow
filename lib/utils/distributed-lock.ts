/**
 * Distributed Lock implementation with Redis backend support
 * Provides Redis distributed lock behavior when Redis is available,
 * with in-memory fallback for development/single-instance deployments
 *
 * Implementation lives in ./distributed-lock/; this file re-exports the public API
 * so existing imports from '@/lib/utils/distributed-lock' keep working.
 */
export {
  distributedLock,
  isRedisAvailable,
  LockAcquisitionError,
  LockReleaseError,
  withDistributedLock,
} from './distributed-lock/index'
