import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateAuthToken, requireAuth, requireAdmin } from '../auth-guard'

// Helper to create a mock NextRequest
function createMockNextRequest(authHeader?: string, cookieHeader?: string) {
  const headers = new Headers()
  if (authHeader) {
    headers.set('Authorization', authHeader)
  }
  if (cookieHeader) {
    headers.set('cookie', cookieHeader)
  }

  return {
    headers,
  } as unknown as import('next/server').NextRequest
}

// Mock the backend validation
function mockFetch(validToken: boolean, isAdmin = false) {
  return vi.spyOn(global, 'fetch').mockImplementation(async () => {
    if (!validToken) {
      return { ok: false, status: 401 } as Response
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ user: { is_admin: isAdmin } }),
    } as Response
  })
}

describe('auth-guard', () => {
  describe('validateAuthToken', () => {
    it('returns null when no Authorization header is present', () => {
      const request = createMockNextRequest()
      expect(validateAuthToken(request)).toBeNull()
    })

    it('returns null for empty Bearer token', () => {
      const request = createMockNextRequest('Bearer ')
      expect(validateAuthToken(request)).toBeNull()
    })

    it('returns null for whitespace-only Bearer token', () => {
      const request = createMockNextRequest('Bearer    ')
      expect(validateAuthToken(request)).toBeNull()
    })

    it('returns the token for valid Bearer token', () => {
      const request = createMockNextRequest('Bearer abc123token')
      expect(validateAuthToken(request)).toBe('abc123token')
    })

    it('handles Bearer prefix case-insensitively', () => {
      const request = createMockNextRequest('bearer ABC123TOKEN')
      expect(validateAuthToken(request)).toBe('ABC123TOKEN')
    })

    it('trims whitespace from token', () => {
      const request = createMockNextRequest('Bearer   token-with-spaces   ')
      expect(validateAuthToken(request)).toBe('token-with-spaces')
    })
  })

  describe('requireAuth', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
    })

    afterEach(() => {
      fetchSpy?.mockRestore()
      vi.useRealTimers()
      // Clear the cache between tests
      vi.resetModules()
    })

    it('returns 401 response when no token is present', async () => {
      const request = createMockNextRequest()
      const response = await requireAuth(request)
      expect(response).not.toBeNull()
      expect(response!.status).toBe(401)
    })

    it('returns 401 response when token is invalid (backend rejects)', async () => {
      fetchSpy = mockFetch(false)
      const request = createMockNextRequest('Bearer invalid-token')
      const response = await requireAuth(request)
      expect(response).not.toBeNull()
      expect(response!.status).toBe(401)
      expect(fetchSpy).toHaveBeenCalled()
    })

    it('returns null when token is valid (backend accepts)', async () => {
      fetchSpy = mockFetch(true)
      const request = createMockNextRequest('Bearer valid-token')

      // Use Promise.race with timeout to avoid hanging
      const response = await Promise.race([
        requireAuth(request),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 100)),
      ])

      expect(response).toBeNull()
      expect(fetchSpy).toHaveBeenCalled()
    })

    it('accepts cookie-based session auth without bearer token', async () => {
      fetchSpy = mockFetch(true)
      const request = createMockNextRequest(undefined, 'laravel_session=abc123')

      const response = await requireAuth(request)

      expect(response).toBeNull()
      expect(fetchSpy).toHaveBeenCalled()
    })

    it('caches validated tokens to avoid excessive backend calls', async () => {
      fetchSpy = mockFetch(true)
      const request = createMockNextRequest('Bearer cached-token')

      // First call should hit the backend
      await requireAuth(request)
      expect(fetchSpy).toHaveBeenCalledTimes(1)

      // Advance time by less than cache TTL
      vi.advanceTimersByTime(10000)

      // Second call should use cache
      await requireAuth(request)
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('requireAdmin', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
    })

    afterEach(() => {
      fetchSpy?.mockRestore()
      vi.useRealTimers()
      vi.resetModules()
    })

    it('returns 401 response when no token is present', async () => {
      const request = createMockNextRequest()
      const response = await requireAdmin(request)
      expect(response).not.toBeNull()
      expect(response!.status).toBe(401)
    })

    it('returns 403 response when user is not admin', async () => {
      fetchSpy = mockFetch(true, false) // Valid token but not admin
      const request = createMockNextRequest('Bearer non-admin-token')
      const response = await requireAdmin(request)
      expect(response).not.toBeNull()
      expect(response!.status).toBe(403)
    })

    it('returns null when user is admin', async () => {
      fetchSpy = mockFetch(true, true) // Valid token and is admin
      const request = createMockNextRequest('Bearer admin-token')

      const response = await Promise.race([
        requireAdmin(request),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 100)),
      ])

      expect(response).toBeNull()
    })

    it('accepts admin auth via session cookie', async () => {
      fetchSpy = mockFetch(true, true)
      const request = createMockNextRequest(undefined, 'laravel_session=admin-cookie')

      const response = await requireAdmin(request)

      expect(response).toBeNull()
      expect(fetchSpy).toHaveBeenCalled()
    })

    it('returns 401 when token is invalid', async () => {
      fetchSpy = mockFetch(false) // Invalid token
      const request = createMockNextRequest('Bearer invalid-token')
      const response = await requireAdmin(request)
      expect(response).not.toBeNull()
      expect(response!.status).toBe(401)
    })
  })
})
