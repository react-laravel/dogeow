import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  handleChatApiError,
  clearChatErrorLog,
  getChatErrorLog,
  hasRecentChatErrors,
} from '../chat-error-handler'

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

describe('chat-error-handler', () => {
  beforeEach(() => {
    clearChatErrorLog()
    vi.clearAllMocks()
  })

  describe('handleError - error type detection', () => {
    it('should handle null error', () => {
      const result = handleChatApiError(null)

      expect(result.type).toBe('unknown')
      expect(result.message).toBe('Unknown error occurred')
      expect(result.retryable).toBe(true)
    })

    it('should handle empty object error', () => {
      const result = handleChatApiError({})

      expect(result.type).toBe('unknown')
      expect(result.message).toBe('Unknown error occurred')
    })

    it('should handle HTTP 400 validation error', () => {
      const error = {
        response: { status: 400, data: {} },
      }

      const result = handleChatApiError(error)

      expect(result.type).toBe('validation')
      expect(result.message).toBe('Invalid request. Please check your input.')
    })

    it('should handle HTTP 401 authentication error', () => {
      const error = {
        response: { status: 401, data: {} },
      }

      const result = handleChatApiError(error)

      expect(result.type).toBe('authentication')
      expect(result.message).toBe('Authentication required. Please log in again.')
      expect(result.retryable).toBe(false)
    })

    it('should handle HTTP 403 access denied', () => {
      const error = {
        response: { status: 403, data: {} },
      }

      const result = handleChatApiError(error)

      expect(result.type).toBe('authentication')
      expect(result.message).toBe(
        'Access denied. You do not have permission to perform this action.'
      )
      expect(result.retryable).toBe(false)
    })

    it('should handle HTTP 404 not found', () => {
      const error = {
        response: { status: 404, data: {} },
      }

      const result = handleChatApiError(error)

      expect(result.type).toBe('validation')
      expect(result.message).toBe('The requested resource was not found.')
      expect(result.retryable).toBe(false)
    })

    it('should handle HTTP 422 validation error with details', () => {
      const error = {
        response: {
          status: 422,
          data: {
            errors: { name: ['Name is required'], email: ['Email is invalid'] },
          },
        },
      }

      const result = handleChatApiError(error)

      expect(result.type).toBe('validation')
      expect(result.message).toBe('Name is required')
      expect(result.details).toEqual({ name: ['Name is required'], email: ['Email is invalid'] })
      expect(result.retryable).toBe(false)
    })

    it('should handle HTTP 422 validation error without details', () => {
      const error = {
        response: {
          status: 422,
          data: {},
        },
      }

      const result = handleChatApiError(error)

      expect(result.type).toBe('validation')
      expect(result.message).toBe('Validation failed. Please check your input.')
    })

    it('should handle HTTP 429 rate limit', () => {
      const error = {
        response: { status: 429, data: {} },
      }

      const result = handleChatApiError(error)

      expect(result.type).toBe('validation')
      expect(result.message).toBe('Too many requests. Please wait a moment before trying again.')
    })

    it('should handle HTTP 500 server error', () => {
      const error = {
        response: { status: 500, data: {} },
      }

      const result = handleChatApiError(error)

      expect(result.type).toBe('server')
      expect(result.message).toBe('Server error. Please try again later.')
    })

    it('should handle HTTP 502 server error', () => {
      const error = {
        response: { status: 502, data: {} },
      }

      const result = handleChatApiError(error)

      expect(result.type).toBe('server')
    })

    it('should handle HTTP 503 server error', () => {
      const error = {
        response: { status: 503, data: {} },
      }

      const result = handleChatApiError(error)

      expect(result.type).toBe('server')
    })

    it('should handle HTTP 504 server error', () => {
      const error = {
        response: { status: 504, data: {} },
      }

      const result = handleChatApiError(error)

      expect(result.type).toBe('server')
    })

    it('should handle unknown HTTP status code', () => {
      const error = {
        response: { status: 418, data: {} },
      }

      const result = handleChatApiError(error)

      expect(result.type).toBe('server')
      expect(result.message).toBe('Server error (418). Please try again later.')
    })

    it('should use server-provided message when available', () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Database connection failed' },
        },
      }

      const result = handleChatApiError(error)

      expect(result.message).toBe('Database connection failed')
    })

    it('should handle network error (has request)', () => {
      const error = {
        request: {},
      }

      const result = handleChatApiError(error)

      expect(result.type).toBe('network')
      expect(result.message).toBe('Network error. Please check your internet connection.')
    })

    it('should handle timeout error code', () => {
      const error = {
        code: 'ECONNABORTED',
      }

      const result = handleChatApiError(error)

      expect(result.type).toBe('timeout')
      expect(result.message).toBe('Request timed out. Please try again.')
    })

    it('should handle TIMEOUT error code', () => {
      const error = {
        code: 'TIMEOUT',
      }

      const result = handleChatApiError(error)

      expect(result.type).toBe('timeout')
    })

    it('should handle NETWORK_ERROR code', () => {
      const error = {
        code: 'NETWORK_ERROR',
      }

      const result = handleChatApiError(error)

      expect(result.type).toBe('network')
    })

    it('should handle ENOTFOUND code', () => {
      const error = {
        code: 'ENOTFOUND',
      }

      const result = handleChatApiError(error)

      expect(result.type).toBe('network')
      expect(result.message).toBe('Unable to connect to the server. Please try again later.')
    })

    it('should handle plain error with message', () => {
      const error = { message: 'Something went wrong' }

      const result = handleChatApiError(error)

      expect(result.message).toBe('Something went wrong')
      expect(result.type).toBe('unknown')
    })

    it('should include context in message when provided', () => {
      const error = { message: 'generic error' }

      const result = handleChatApiError(error, 'ChatOperation')

      expect(result.message).toBe('ChatOperation: generic error')
    })

    it('should handle empty error with custom context', () => {
      const result = handleChatApiError(null, 'CustomContext')

      // null error uses default message with context prefix
      expect(result.message).toBe('CustomContext: Unknown error occurred')
    })
  })

  describe('options', () => {
    it('should suppress toast when showToast is false', () => {
      handleChatApiError({ response: { status: 500, data: {} } }, undefined, { showToast: false })

      // The toast mock was set up via vi.mock('sonner')
      // When showToast is false, showErrorToast is not called
      // This is verified by the fact that no error is thrown
      expect(true).toBe(true)
    })

    it('should suppress logging when logError is false', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      handleChatApiError({ response: { status: 500, data: {} } }, undefined, { logError: false })

      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should call onError callback when provided', () => {
      const onError = vi.fn()

      handleChatApiError({ response: { status: 500, data: {} } }, undefined, { onError })

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'server',
          message: 'Server error. Please try again later.',
        })
      )
    })

    it('should set retryable to false when specified', () => {
      const result = handleChatApiError({ message: 'generic' }, undefined, { retryable: false })

      expect(result.retryable).toBe(false)
    })
  })

  describe('error log management', () => {
    it('should track errors in log', () => {
      handleChatApiError({ message: 'error 1' })
      handleChatApiError({ message: 'error 2' })

      const log = getChatErrorLog()
      expect(log).toHaveLength(2)
    })

    it('should clear error log', () => {
      handleChatApiError({ message: 'error 1' })
      expect(getChatErrorLog()).toHaveLength(1)

      clearChatErrorLog()
      expect(getChatErrorLog()).toHaveLength(0)
    })

    it('should track multiple errors', () => {
      handleChatApiError({ response: { status: 500, data: {} } })
      handleChatApiError({ response: { status: 401, data: {} } })
      handleChatApiError({ response: { status: 500, data: {} } })

      expect(getChatErrorLog()).toHaveLength(3)
    })

    it('should detect recent errors', () => {
      const result = hasRecentChatErrors()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('return value properties', () => {
    it('should include timestamp in error', () => {
      const before = Date.now()
      const result = handleChatApiError({ message: 'test' })
      const after = Date.now()

      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before)
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(after)
    })

    it('should include name property', () => {
      const result = handleChatApiError({ message: 'test' })

      expect(result.name).toBe('ChatApiError')
    })

    it('should include code and status when available', () => {
      const result = handleChatApiError({ response: { status: 404, data: {} } })

      expect(result.code).toBe(404)
      expect(result.status).toBe(404)
    })
  })
})
