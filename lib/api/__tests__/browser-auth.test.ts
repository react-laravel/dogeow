import { describe, expect, it, vi, beforeEach } from 'vitest'
import { authenticatedBrowserFetch, ensureBrowserCsrfCookie } from '../browser-auth'

// Mock browser-request
vi.mock('../browser-request', () => ({
  createBrowserRequestHeaders: vi.fn(opts => ({
    'Content-Type': 'application/json',
    ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    ...opts.headers,
  })),
  ensureCsrfCookie: vi.fn(),
  executeBrowserRequestWithCsrf: vi.fn(async (_method, execute) => execute()),
  getXsrfTokenFromCookie: vi.fn().mockReturnValue(null),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('browser-auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('authenticatedBrowserFetch', () => {
    it('should make a GET request with default options', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      await authenticatedBrowserFetch('/api/test')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      )
    })

    it('should include Authorization header when token is provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      await authenticatedBrowserFetch('/api/test', {
        token: 'test-token-123',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      )
    })

    it('should not include Authorization header when token is null', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      await authenticatedBrowserFetch('/api/test', {
        token: null,
      })

      const callArgs = mockFetch.mock.calls[0][1]
      expect(callArgs.headers).not.toHaveProperty('Authorization')
    })

    it('should pass body for POST request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      const body = JSON.stringify({ name: 'test' })

      await authenticatedBrowserFetch('/api/test', {
        method: 'POST',
        body,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body,
        })
      )
    })

    it('should handle FormData body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      const formData = new FormData()
      formData.append('key', 'value')

      await authenticatedBrowserFetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/upload',
        expect.objectContaining({
          method: 'POST',
          body: formData,
        })
      )
    })

    it('should include custom headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      await authenticatedBrowserFetch('/api/test', {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      })

      const callArgs = mockFetch.mock.calls[0][1]
      expect(callArgs.headers['X-Custom-Header']).toBe('custom-value')
    })

    it('should normalize method to uppercase', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      await authenticatedBrowserFetch('/api/test', {
        method: 'post',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('should normalize method to uppercase (patch)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      await authenticatedBrowserFetch('/api/test', {
        method: 'patch',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'PATCH',
        })
      )
    })

    it('should pass through other fetch options', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      await authenticatedBrowserFetch('/api/test', {
        mode: 'cors',
        cache: 'no-cache',
      })

      const callArgs = mockFetch.mock.calls[0][1]
      expect(callArgs.mode).toBe('cors')
      expect(callArgs.cache).toBe('no-cache')
    })
  })

  describe('ensureBrowserCsrfCookie', () => {
    it('should be exported and callable', () => {
      expect(typeof ensureBrowserCsrfCookie).toBe('function')
    })
  })
})
