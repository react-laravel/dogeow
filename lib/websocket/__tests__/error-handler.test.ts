import { describe, expect, it, vi, beforeEach } from 'vitest'
import WebSocketErrorHandler, {
  type ConnectionError,
  type ErrorHandlerOptions,
} from '../error-handler'

describe('WebSocketErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const handler = new WebSocketErrorHandler()

      expect(handler.getMaxAttempts()).toBe(5)
      expect(handler.getCurrentAttempt()).toBe(0)
    })

    it('should merge custom retry config', () => {
      const handler = new WebSocketErrorHandler({
        retryConfig: { maxAttempts: 10, baseDelay: 500 },
      })

      expect(handler.getMaxAttempts()).toBe(10)
    })
  })

  describe('parseError', () => {
    it('should handle unknown errors', () => {
      const handler = new WebSocketErrorHandler()
      const result = handler.handleError(new Error('unknown error'))

      expect(result.type).toBe('unknown')
      expect(result.message).toBe('unknown error')
      expect(result.retryable).toBe(true)
    })

    it('should handle authentication error code 4000', () => {
      const handler = new WebSocketErrorHandler()
      const result = handler.handleError({ code: 4000 })

      expect(result.type).toBe('authentication')
      expect(result.message).toBe('Authentication failed')
      expect(result.retryable).toBe(false)
    })

    it('should handle authentication token expired code 4001', () => {
      const handler = new WebSocketErrorHandler()
      const result = handler.handleError({ code: 4001 })

      expect(result.type).toBe('authentication')
      expect(result.message).toBe('Authentication token expired')
      expect(result.retryable).toBe(true)
    })

    it('should handle connection limit exceeded code 4004', () => {
      const handler = new WebSocketErrorHandler()
      const result = handler.handleError({ code: 4004 })

      expect(result.type).toBe('connection')
      expect(result.message).toBe('Connection limit exceeded')
      expect(result.retryable).toBe(false)
    })

    it('should handle connection refused code 4100', () => {
      const handler = new WebSocketErrorHandler()
      const result = handler.handleError({ code: 4100 })

      expect(result.type).toBe('connection')
      expect(result.message).toBe('Connection refused')
      expect(result.retryable).toBe(true)
    })

    it('should handle connection timeout code 4200', () => {
      const handler = new WebSocketErrorHandler()
      const result = handler.handleError({ code: 4200 })

      expect(result.type).toBe('connection')
      expect(result.message).toBe('Connection timeout')
      expect(result.retryable).toBe(true)
    })

    it('should handle generic 4xxx codes', () => {
      const handler = new WebSocketErrorHandler()
      const result = handler.handleError({ code: 4500, message: 'Custom error' })

      expect(result.type).toBe('connection')
      expect(result.message).toBe('Custom error')
    })

    it('should handle 4xxx codes without message', () => {
      const handler = new WebSocketErrorHandler()
      const result = handler.handleError({ code: 4500 })

      expect(result.type).toBe('connection')
      expect(result.message).toBe('Connection failed')
    })

    it('should handle network error patterns', () => {
      const handler = new WebSocketErrorHandler()
      const result = handler.handleError(new Error('network connection lost'))

      expect(result.type).toBe('network')
      expect(result.retryable).toBe(true)
    })

    it('should handle timeout error patterns', () => {
      const handler = new WebSocketErrorHandler()
      const result = handler.handleError(new Error('request timeout'))

      expect(result.type).toBe('timeout')
      expect(result.retryable).toBe(true)
    })

    it('should handle auth error patterns', () => {
      const handler = new WebSocketErrorHandler()
      const result = handler.handleError(new Error('auth token invalid'))

      expect(result.type).toBe('authentication')
      expect(result.retryable).toBe(true)
    })

    it('should handle connect error patterns', () => {
      const handler = new WebSocketErrorHandler()
      const result = handler.handleError(new Error('connection refused'))

      expect(result.type).toBe('connection')
      expect(result.retryable).toBe(true)
    })

    it('should include context in message', () => {
      const handler = new WebSocketErrorHandler()
      const result = handler.handleError(new Error('fail'), 'WebSocketOp')

      expect(result.message).toBe('WebSocketOp: fail')
    })

    it('should include code in result', () => {
      const handler = new WebSocketErrorHandler()
      const result = handler.handleError({ code: 4001 })

      expect(result.code).toBe(4001)
    })

    it('should include timestamp', () => {
      const handler = new WebSocketErrorHandler()
      const before = Date.now()
      const result = handler.handleError(new Error('test'))
      const after = Date.now()

      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before)
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(after)
    })
  })

  describe('handleError callbacks', () => {
    it('should call onError callback', () => {
      const onError = vi.fn()
      const handler = new WebSocketErrorHandler({ onError })

      handler.handleError(new Error('test'))

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'unknown',
          message: 'test',
        })
      )
    })

    it('should notify listeners', () => {
      const handler = new WebSocketErrorHandler()
      const listener = vi.fn()

      handler.subscribe(listener)

      handler.handleError({ code: 4000 })

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'authentication',
        })
      )
    })

    it('should not notify after unsubscribe', () => {
      const handler = new WebSocketErrorHandler()
      const listener = vi.fn()

      const unsubscribe = handler.subscribe(listener)
      unsubscribe()

      handler.handleError(new Error('test'))

      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('shouldRetry', () => {
    it('should return false for non-retryable errors', () => {
      const handler = new WebSocketErrorHandler()
      const error: ConnectionError = {
        type: 'authentication',
        message: 'Auth failed',
        timestamp: new Date(),
        retryable: false,
      }

      expect(handler.shouldRetry(error)).toBe(false)
    })

    it('should return true when under max attempts', () => {
      const handler = new WebSocketErrorHandler({ retryConfig: { maxAttempts: 3 } })
      const error: ConnectionError = {
        type: 'network',
        message: 'Network error',
        timestamp: new Date(),
        retryable: true,
      }

      expect(handler.shouldRetry(error)).toBe(true)
    })

    it('should return false when at max attempts', () => {
      const handler = new WebSocketErrorHandler({ retryConfig: { maxAttempts: 2 } })
      handler['currentAttempt'] = 2

      const error: ConnectionError = {
        type: 'network',
        message: 'Network error',
        timestamp: new Date(),
        retryable: true,
      }

      expect(handler.shouldRetry(error)).toBe(false)
    })
  })

  describe('scheduleRetry', () => {
    it('should not schedule when at max attempts', () => {
      const onMaxRetriesReached = vi.fn()
      const handler = new WebSocketErrorHandler({
        retryConfig: { maxAttempts: 2 },
        onMaxRetriesReached,
      })
      handler['currentAttempt'] = 2

      handler.scheduleRetry(() => {})

      expect(onMaxRetriesReached).toHaveBeenCalled()
    })

    it('should schedule retry with callback', () => {
      const handler = new WebSocketErrorHandler({
        retryConfig: { maxAttempts: 3, baseDelay: 100, backoffMultiplier: 2 },
      })

      const callback = vi.fn()
      handler.scheduleRetry(callback)

      // Should not call immediately
      expect(callback).not.toHaveBeenCalled()

      // Fast-forward past the delay
      const delay = handler['calculateRetryDelay']()
      vi.advanceTimersByTime(delay + 10)

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should call onRetry callback with attempt and delay', () => {
      const onRetry = vi.fn()
      const handler = new WebSocketErrorHandler({
        retryConfig: { maxAttempts: 3, baseDelay: 100 },
        onRetry,
      })

      handler.scheduleRetry(() => {})

      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Number))
    })

    it('should increment currentAttempt', () => {
      const handler = new WebSocketErrorHandler({
        retryConfig: { maxAttempts: 3 },
      })

      expect(handler.getCurrentAttempt()).toBe(0)

      handler.scheduleRetry(() => {})

      expect(handler.getCurrentAttempt()).toBe(1)
    })
  })

  describe('resetRetryCount', () => {
    it('should reset currentAttempt to 0', () => {
      const handler = new WebSocketErrorHandler()
      handler['currentAttempt'] = 3

      handler.resetRetryCount()

      expect(handler.getCurrentAttempt()).toBe(0)
    })

    it('should clear retry timeout', () => {
      const handler = new WebSocketErrorHandler()
      handler['retryTimeout'] = 123 as unknown as NodeJS.Timeout

      handler.resetRetryCount()

      expect(handler['retryTimeout']).toBeNull()
    })
  })

  describe('destroy', () => {
    it('should clear timeout and listeners', () => {
      const handler = new WebSocketErrorHandler()
      const listener = vi.fn()

      handler.subscribe(listener)
      handler.destroy()

      expect(handler['listeners']).toHaveLength(0)
    })
  })
})
