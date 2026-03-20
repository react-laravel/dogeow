import { NextRequest } from 'next/server'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from '../route'

// Mock fetch
global.fetch = vi.fn()

// Mock requireAuth - vi.mock is hoisted, so we need to import it first
vi.mock('../../../_lib/auth-guard', () => ({
  requireAuth: vi.fn(),
}))

describe('Ollama Models API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockRequest = (authHeader?: string): NextRequest => {
    const headers = new Headers()
    if (authHeader) {
      headers.set('Authorization', authHeader)
    }
    return {
      headers,
      nextUrl: new URL('http://localhost:3000/api/ollama/models'),
    } as unknown as NextRequest
  }

  describe('Authentication', () => {
    it('returns 401 when no Authorization header is present', async () => {
      const { requireAuth } = await import('../../../_lib/auth-guard')
      vi.mocked(requireAuth).mockReturnValueOnce(
        new (await import('next/server')).NextResponse.json(
          { error: '未授权', message: '请先登录或提供有效的认证令牌' },
          { status: 401 }
        )
      )

      const request = createMockRequest()
      const response = await GET(request)
      expect(response.status).toBe(401)
    })

    it('allows request when valid Bearer token is present', async () => {
      const { requireAuth } = await import('../../../_lib/auth-guard')
      vi.mocked(requireAuth).mockReturnValueOnce(null)

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      } as unknown as Response)

      const request = createMockRequest('Bearer valid-token')
      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Model listing', () => {
    it('returns empty models list when Ollama has no models', async () => {
      const { requireAuth } = await import('../../../_lib/auth-guard')
      vi.mocked(requireAuth).mockReturnValueOnce(null)

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      } as unknown as Response)

      const request = createMockRequest('Bearer valid-token')
      const response = await GET(request)
      const data = await response.json()
      expect(data.models).toEqual([])
    })

    it('returns models with correct structure', async () => {
      const { requireAuth } = await import('../../../_lib/auth-guard')
      vi.mocked(requireAuth).mockReturnValueOnce(null)

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              models: [
                {
                  name: 'qwen3:0.6b',
                  size: 1234567,
                  modified_at: '2025-01-01T00:00:00Z',
                  details: { family: 'qwen', parameter_size: '0.6B' },
                },
              ],
            }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              capabilities: ['completion', 'chat'],
              details: { family: 'qwen', parameter_size: '0.6B' },
            }),
        } as unknown as Response)

      const request = createMockRequest('Bearer valid-token')
      const response = await GET(request)
      const data = await response.json()
      expect(data.models).toHaveLength(1)
      expect(data.models[0].name).toBe('qwen3:0.6b')
      expect(data.models[0].supportsVision).toBe(false)
    })
  })
})
