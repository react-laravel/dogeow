import { describe, it, expect, vi } from 'vitest'

/**
 * @deprecated 此文件未被项目使用，请使用 `@/lib/api` 替代。
 */
import { handleApiResponse, apiRequest } from '../api'

describe('lib/utils/api (deprecated)', () => {
  describe('handleApiResponse', () => {
    it('should return success with data for ok response', async () => {
      const response = {
        ok: true,
        json: async () => ({ data: { id: 1, name: 'test' } }),
      } as Response

      const result = await handleApiResponse(response)
      expect(result).toEqual({ success: true, data: { id: 1, name: 'test' } })
    })

    it('should return raw data when response has no data wrapper', async () => {
      const response = {
        ok: true,
        json: async () => ({ id: 1, name: 'test' }),
      } as Response

      const result = await handleApiResponse(response)
      expect(result).toEqual({ success: true, data: { id: 1, name: 'test' } })
    })

    it('should return error for non-ok response with message', async () => {
      const response = {
        ok: false,
        json: async () => ({ message: 'Something went wrong' }),
      } as unknown as Response

      const result = await handleApiResponse(response)
      expect(result).toEqual({ success: false, error: 'Something went wrong' })
    })

    it('should return generic error for non-ok response without message', async () => {
      const response = {
        ok: false,
        json: async () => ({}),
      } as unknown as Response

      const result = await handleApiResponse(response)
      expect(result).toEqual({ success: false, error: '请求失败' })
    })

    it('should return error when JSON parsing fails', async () => {
      const response = {
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      } as Response

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await handleApiResponse(response)
      expect(result).toEqual({ success: false, error: '响应解析错误' })
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('apiRequest', () => {
    const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

    beforeEach(() => {
      delete (process.env as Record<string, string | undefined>).NEXT_PUBLIC_API_BASE_URL
    })

    afterEach(() => {
      if (originalApiBaseUrl !== undefined) {
        process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl
      } else {
        delete (process.env as Record<string, string | undefined>).NEXT_PUBLIC_API_BASE_URL
      }
    })

    it('should make a GET request to default endpoint', async () => {
      const mockData = { id: 1 }
      const mockResponse = {
        ok: true,
        json: async () => ({ data: mockData }),
      } as Response

      global.fetch = vi.fn(async () => mockResponse)

      const result = await apiRequest<{ id: number }>('users')
      expect(result).toEqual({ success: true, data: { id: 1 } })
      expect(fetch).toHaveBeenCalledWith('/api/users', expect.any(Object))
    })

    it('should use custom API base URL from env', async () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3001'
      const mockResponse = {
        ok: true,
        json: async () => ({ data: [] }),
      } as Response

      global.fetch = vi.fn(async () => mockResponse)

      await apiRequest('items')
      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/items', expect.any(Object))
    })

    it('should merge custom headers', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: [] }),
      } as unknown as Response

      global.fetch = vi.fn(async () => mockResponse)

      await apiRequest('items', {
        headers: { 'X-Custom-Header': 'value' },
      })

      const callArgs = vi.mocked(fetch).mock.calls[0]![1]!
      // Note: spreading ...options after headers means options.headers replaces the defaults
      expect(callArgs.headers).toEqual({
        'X-Custom-Header': 'value',
      })
    })

    it('should return error on network failure', async () => {
      global.fetch = vi.fn(async () => {
        throw new Error('Network error')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await apiRequest('items')
      expect(result.success).toBe(false)
      expect(result.error).toBe('网络请求失败')

      consoleSpy.mockRestore()
    })
  })
})
