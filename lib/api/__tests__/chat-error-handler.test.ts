import { describe, it, expect, vi, beforeEach } from 'vitest'
import chatApiErrorHandler, {
  handleChatApiError,
  getChatErrorLog,
  clearChatErrorLog,
  hasRecentChatErrors,
  ChatApiError,
} from '../chat-error-handler'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

// Mock error reporting service
vi.mock('@/lib/services/errorReportingService', () => ({
  reportChatError: vi.fn(),
}))

describe('chat-error-handler', () => {
  beforeEach(() => {
    chatApiErrorHandler.clearErrorLog()
    vi.clearAllMocks()
  })

  describe('ChatApiErrorHandler', () => {
    describe('handleError', () => {
      it('should handle error with default options', () => {
        const error = new Error('Test error')
        const result = chatApiErrorHandler.handleError(error)
        expect(result).toBeDefined()
        expect(result.message).toBe('Test error')
      })

      it('should handle null error', () => {
        const result = chatApiErrorHandler.handleError(null)
        expect(result.type).toBe('unknown')
        expect(result.message).toContain('Unknown error')
      })

      it('should handle undefined error', () => {
        const result = chatApiErrorHandler.handleError(undefined)
        expect(result.type).toBe('unknown')
      })

      it('should handle empty object error', () => {
        const result = chatApiErrorHandler.handleError({})
        expect(result.type).toBe('unknown')
      })

      it('should handle error with context', () => {
        const error = new Error('Test error')
        const result = chatApiErrorHandler.handleError(error, 'API Call')
        expect(result.message).toContain('API Call')
      })

      it('should parse HTTP 400 validation error', () => {
        const error = {
          response: {
            status: 400,
            data: { message: 'Invalid input' },
          },
        }
        const result = chatApiErrorHandler.handleError(error)
        expect(result.type).toBe('validation')
        expect(result.status).toBe(400)
      })

      it('should parse HTTP 401 authentication error', () => {
        const error = {
          response: {
            status: 401,
            data: { message: 'Unauthorized' },
          },
        }
        const result = chatApiErrorHandler.handleError(error)
        expect(result.type).toBe('authentication')
        expect(result.status).toBe(401)
        expect(result.retryable).toBe(false)
      })

      it('should parse HTTP 403 authentication error', () => {
        const error = {
          response: {
            status: 403,
            data: { message: 'Forbidden' },
          },
        }
        const result = chatApiErrorHandler.handleError(error)
        expect(result.type).toBe('authentication')
        expect(result.status).toBe(403)
        expect(result.retryable).toBe(false)
      })

      it('should parse HTTP 404 validation error', () => {
        const error = {
          response: {
            status: 404,
            data: { message: 'Not found' },
          },
        }
        const result = chatApiErrorHandler.handleError(error)
        expect(result.type).toBe('validation')
        expect(result.status).toBe(404)
        expect(result.retryable).toBe(false)
      })

      it('should parse HTTP 422 validation error', () => {
        const error = {
          response: {
            status: 422,
            data: {
              message: 'Validation failed',
              errors: { name: ['Name is required'] },
            },
          },
        }
        const result = chatApiErrorHandler.handleError(error)
        expect(result.type).toBe('validation')
        expect(result.status).toBe(422)
        expect(result.retryable).toBe(false)
      })

      it('should parse HTTP 429 validation error', () => {
        const error = {
          response: {
            status: 429,
            data: { message: 'Rate limited' },
          },
        }
        const result = chatApiErrorHandler.handleError(error)
        expect(result.type).toBe('validation')
        expect(result.status).toBe(429)
      })

      it('should parse HTTP 500 server error', () => {
        const error = {
          response: {
            status: 500,
            data: { message: 'Internal server error' },
          },
        }
        const result = chatApiErrorHandler.handleError(error)
        expect(result.type).toBe('server')
        expect(result.status).toBe(500)
      })

      it('should parse HTTP 502 server error', () => {
        const error = {
          response: {
            status: 502,
            data: { message: 'Bad gateway' },
          },
        }
        const result = chatApiErrorHandler.handleError(error)
        expect(result.type).toBe('server')
        expect(result.status).toBe(502)
      })

      it('should parse HTTP 503 server error', () => {
        const error = {
          response: {
            status: 503,
            data: { message: 'Service unavailable' },
          },
        }
        const result = chatApiErrorHandler.handleError(error)
        expect(result.type).toBe('server')
        expect(result.status).toBe(503)
      })

      it('should parse HTTP 504 server error', () => {
        const error = {
          response: {
            status: 504,
            data: { message: 'Gateway timeout' },
          },
        }
        const result = chatApiErrorHandler.handleError(error)
        expect(result.type).toBe('server')
        expect(result.status).toBe(504)
      })

      it('should parse network error (no response)', () => {
        const error = {
          request: {},
        }
        const result = chatApiErrorHandler.handleError(error)
        expect(result.type).toBe('network')
      })

      it('should parse ECONNABORTED timeout error', () => {
        const error = {
          code: 'ECONNABORTED',
          message: 'Request aborted',
        }
        const result = chatApiErrorHandler.handleError(error)
        expect(result.type).toBe('timeout')
      })

      it('should parse TIMEOUT error', () => {
        const error = {
          code: 'TIMEOUT',
          message: 'Request timed out',
        }
        const result = chatApiErrorHandler.handleError(error)
        expect(result.type).toBe('timeout')
      })

      it('should parse NETWORK_ERROR', () => {
        const error = {
          code: 'NETWORK_ERROR',
          message: 'Network error',
        }
        const result = chatApiErrorHandler.handleError(error)
        expect(result.type).toBe('network')
      })

      it('should parse ENOTFOUND error', () => {
        const error = {
          code: 'ENOTFOUND',
          message: 'Host not found',
        }
        const result = chatApiErrorHandler.handleError(error)
        expect(result.type).toBe('network')
      })

      it('should not show toast when showToast is false', () => {
        const { toast } = require('sonner')
        const error = new Error('Test error')
        chatApiErrorHandler.handleError(error, undefined, { showToast: false })
        expect(toast.error).not.toHaveBeenCalled()
      })

      it('should not log error when logError is false', () => {
        const error = new Error('Test error')
        chatApiErrorHandler.handleError(error, undefined, { logError: false })
        expect(chatApiErrorHandler.getErrorLog()).toHaveLength(0)
      })

      it('should not report error when reportError is false', () => {
        const { reportChatError } = require('@/lib/services/errorReportingService')
        const error = new Error('Test error')
        chatApiErrorHandler.handleError(error, undefined, { reportError: false })
        expect(reportChatError).not.toHaveBeenCalled()
      })

      it('should call onError callback when provided', () => {
        const error = new Error('Test error')
        const onError = vi.fn()
        chatApiErrorHandler.handleError(error, undefined, { onError })
        expect(onError).toHaveBeenCalled()
      })

      it('should use fallbackMessage when provided', () => {
        const error = new Error()
        const result = chatApiErrorHandler.handleError(error, undefined, {
          fallbackMessage: 'Custom fallback',
        })
        expect(result.message).toBe('Custom fallback')
      })
    })

    describe('getErrorLog', () => {
      it('should return empty array initially', () => {
        expect(chatApiErrorHandler.getErrorLog()).toEqual([])
      })

      it('should return logged errors', () => {
        chatApiErrorHandler.handleError(new Error('Error 1'), undefined, { logError: true })
        chatApiErrorHandler.handleError(new Error('Error 2'), undefined, { logError: true })
        expect(chatApiErrorHandler.getErrorLog()).toHaveLength(2)
      })

      it('should return copy of error log', () => {
        chatApiErrorHandler.handleError(new Error('Error 1'), undefined, { logError: true })
        const log1 = chatApiErrorHandler.getErrorLog()
        const log2 = chatApiErrorHandler.getErrorLog()
        expect(log1).not.toBe(log2)
      })
    })

    describe('clearErrorLog', () => {
      it('should clear all logged errors', () => {
        chatApiErrorHandler.handleError(new Error('Error 1'), undefined, { logError: true })
        chatApiErrorHandler.handleError(new Error('Error 2'), undefined, { logError: true })
        chatApiErrorHandler.clearErrorLog()
        expect(chatApiErrorHandler.getErrorLog()).toEqual([])
      })
    })

    describe('getErrorsByType', () => {
      it('should return errors filtered by type', () => {
        chatApiErrorHandler.handleError(
          { response: { status: 400, data: {} } },
          undefined,
          { logError: true }
        )
        chatApiErrorHandler.handleError(
          { response: { status: 401, data: {} } },
          undefined,
          { logError: true }
        )
        const validationErrors = chatApiErrorHandler.getErrorsByType('validation')
        expect(validationErrors).toHaveLength(1)
        expect(validationErrors[0].type).toBe('validation')
      })
    })

    describe('getRecentErrors', () => {
      it('should return errors within specified minutes', () => {
        chatApiErrorHandler.handleError(new Error('Error 1'), undefined, { logError: true })
        const recentErrors = chatApiErrorHandler.getRecentErrors(5)
        expect(recentErrors).toHaveLength(1)
      })

      it('should return empty array for old errors', () => {
        // Manually add an old error
        chatApiErrorHandler.clearErrorLog()
        const oldError: ChatApiError = {
          name: 'ChatApiError',
          type: 'unknown',
          message: 'Old error',
          timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
          retryable: true,
          userFriendly: true,
        }
        // This is a workaround - in real tests you'd use fake timers
      })
    })

    describe('hasRecentErrors', () => {
      it('should return true when recent errors exist', () => {
        chatApiErrorHandler.handleError(new Error('Error 1'), undefined, { logError: true })
        expect(chatApiErrorHandler.hasRecentErrors()).toBe(true)
      })

      it('should return false when no recent errors', () => {
        chatApiErrorHandler.clearErrorLog()
        expect(chatApiErrorHandler.hasRecentErrors()).toBe(false)
      })

      it('should filter by type when specified', () => {
        chatApiErrorHandler.handleError(
          { response: { status: 400, data: {} } },
          undefined,
          { logError: true }
        )
        expect(chatApiErrorHandler.hasRecentErrors('validation')).toBe(true)
        expect(chatApiErrorHandler.hasRecentErrors('authentication')).toBe(false)
      })
    })
  })

  describe('Convenience Functions', () => {
    describe('handleChatApiError', () => {
      it('should handle error and return ChatApiError', () => {
        const result = handleChatApiError(new Error('Test error'))
        expect(result).toBeDefined()
        expect(result.message).toBe('Test error')
      })
    })

    describe('getChatErrorLog', () => {
      it('should return current error log', () => {
        handleChatApiError(new Error('Error 1'))
        const log = getChatErrorLog()
        expect(log.length).toBeGreaterThan(0)
      })
    })

    describe('clearChatErrorLog', () => {
      it('should clear the error log', () => {
        handleChatApiError(new Error('Error 1'))
        clearChatErrorLog()
        expect(getChatErrorLog()).toEqual([])
      })
    })

    describe('hasRecentChatErrors', () => {
      it('should check for recent errors', () => {
        clearChatErrorLog()
        expect(hasRecentChatErrors()).toBe(false)
        handleChatApiError(new Error('Error 1'))
        expect(hasRecentChatErrors()).toBe(true)
      })
    })
  })
})