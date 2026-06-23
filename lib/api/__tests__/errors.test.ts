import { describe, it, expect, vi } from 'vitest'

// Use vi.hoisted() so the mock reference is available in both vi.mock() and tests
const mockToast = vi.hoisted(() => ({
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: mockToast,
}))

import {
  ApiRequestError,
  isStandardApiResponse,
  unwrapApiPayload,
  handleApiError,
  validateAndNormalizeError,
} from '../errors'

describe('ApiRequestError', () => {
  it('should create error with status and data', () => {
    const error = new ApiRequestError('Not found', 404, { errors: { field: ['error'] } })
    expect(error.message).toBe('Not found')
    expect(error.status).toBe(404)
    expect(error.data).toEqual({ errors: { field: ['error'] } })
    expect(error.name).toBe('ApiRequestError')
  })

  it('should be instance of Error', () => {
    const error = new ApiRequestError('Test', 400)
    expect(error instanceof Error).toBe(true)
  })
})

describe('isStandardApiResponse', () => {
  it('should return true for valid standard response', () => {
    expect(isStandardApiResponse({ success: true, data: {} })).toBe(true)
    expect(isStandardApiResponse({ success: false, message: 'error' })).toBe(true)
  })

  it('should return false for non-object', () => {
    expect(isStandardApiResponse(null)).toBe(false)
    expect(isStandardApiResponse(undefined)).toBe(false)
    expect(isStandardApiResponse('string')).toBe(false)
    expect(isStandardApiResponse(42)).toBe(false)
  })

  it('should return false for object without success', () => {
    expect(isStandardApiResponse({ data: {} })).toBe(false)
    expect(isStandardApiResponse({ message: 'error' })).toBe(false)
  })

  it('should return false when success is not boolean', () => {
    expect(isStandardApiResponse({ success: 'true' })).toBe(false)
    expect(isStandardApiResponse({ success: 1 })).toBe(false)
  })
})

describe('unwrapApiPayload', () => {
  it('should return data from standard response', () => {
    const response = { success: true, data: { id: 1, name: 'Test' } }
    expect(unwrapApiPayload(response)).toEqual({ id: 1, name: 'Test' })
  })

  it('should return value as-is for non-standard response', () => {
    const data = { id: 1, name: 'Test' }
    expect(unwrapApiPayload(data)).toBe(data)
  })

  it('should return empty object for standard response without data', () => {
    const response = { success: true }
    expect(unwrapApiPayload(response)).toEqual({})
  })

  it('should handle null response', () => {
    expect(unwrapApiPayload(null)).toBe(null)
  })
})

describe('handleApiError', () => {
  it('should handle ApiRequestError with 422 status', () => {
    mockToast.error.mockClear()
    const error = new ApiRequestError('Validation failed', 422, {
      errors: { email: ['Invalid email'] },
    })
    handleApiError(error)
    expect(mockToast.error).toHaveBeenCalledWith('Invalid email')
  })

  it('should handle ApiRequestError with 500 status', () => {
    mockToast.error.mockClear()
    const error = new ApiRequestError('Server error', 500)
    handleApiError(error)
    expect(mockToast.error).toHaveBeenCalled()
  })

  it('should handle plain Error', () => {
    mockToast.error.mockClear()
    handleApiError(new Error('Network failed'))
    expect(mockToast.error).toHaveBeenCalled()
  })

  it('should handle unknown error', () => {
    mockToast.error.mockClear()
    handleApiError('unknown error')
    expect(mockToast.error).toHaveBeenCalled()
  })
})

describe('validateAndNormalizeError', () => {
  it('should pass through Error instances', () => {
    const error = new Error('Original error')
    const normalized = validateAndNormalizeError(error)
    expect(normalized).toBe(error)
  })

  it('should handle null/undefined', () => {
    expect(validateAndNormalizeError(null).message).toBe('未知错误：错误对象为空')
    expect(validateAndNormalizeError(undefined).message).toBe('未知错误：错误对象为空')
  })

  it('should handle string errors', () => {
    expect(validateAndNormalizeError('string error').message).toBe('API请求失败: string error')
  })

  it('should handle object with message', () => {
    const normalized = validateAndNormalizeError({ message: 'Not found' })
    expect(normalized.message).toBe('Not found')
  })

  it('should handle object with error property', () => {
    const normalized = validateAndNormalizeError({ error: 'Something went wrong' })
    expect(normalized.message).toBe('Something went wrong')
  })

  it('should handle object with detail property', () => {
    const normalized = validateAndNormalizeError({ detail: 'Detail message' })
    expect(normalized.message).toBe('Detail message')
  })

  it('should handle AbortError', () => {
    // When message is also present, message takes priority (checked first in source)
    // Test with name only to verify AbortError detection
    const normalized = validateAndNormalizeError({ name: 'AbortError' } as any)
    expect(normalized.message).toBe('请求被取消')
  })

  it('should handle NetworkError', () => {
    const normalized = validateAndNormalizeError({ name: 'NetworkError' } as any)
    expect(normalized.message).toBe('网络连接失败')
  })

  it('should handle TimeoutError', () => {
    const normalized = validateAndNormalizeError({ name: 'TimeoutError' } as any)
    expect(normalized.message).toBe('请求超时')
  })

  it('should handle object with status code', () => {
    const normalized = validateAndNormalizeError({ status: 500, message: 'Server error' })
    expect(normalized.message).toBe('Server error')
    expect((normalized as any).status).toBe(500)
  })

  it('should handle object with code', () => {
    const normalized = validateAndNormalizeError({ code: 'ENOTFOUND' })
    expect(normalized.message).toBe('API请求失败 (错误代码: ENOTFOUND)')
  })
})
