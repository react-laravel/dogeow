import { describe, it, expect } from 'vitest'
import { validateAuthToken, requireAuth } from '../auth-guard'

// Helper to create a mock NextRequest
function createMockRequest(authHeader?: string): Request {
  const headers = new Headers()
  if (authHeader) {
    headers.set('Authorization', authHeader)
  }
  return new Request('http://localhost/api/test', { headers }) as unknown as Request
}

// Minimal NextRequest-compatible object for testing
function createMockNextRequest(authHeader?: string) {
  return {
    headers: new Headers(authHeader ? { Authorization: authHeader } : {}),
  } as unknown as import('next/server').NextRequest
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
    it('returns 401 response when no token is present', () => {
      const request = createMockNextRequest()
      const response = requireAuth(request)
      expect(response).not.toBeNull()
      expect(response!.status).toBe(401)
    })

    it('returns null when valid token is present', () => {
      const request = createMockNextRequest('Bearer valid-token')
      const response = requireAuth(request)
      expect(response).toBeNull()
    })
  })
})
