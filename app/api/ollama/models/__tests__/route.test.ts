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
        (await import('next/server')).NextResponse.json(
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

    it('filters out embedding models by name pattern', async () => {
      const { requireAuth } = await import('../../../_lib/auth-guard')
      vi.mocked(requireAuth).mockReturnValueOnce(null)

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            models: [
              { name: 'nomic-embed-text:latest', size: 123456 },
              { name: 'qwen3:0.6b', size: 1234567 },
            ],
          }),
      } as unknown as Response)

      const request = createMockRequest('Bearer valid-token')
      const response = await GET(request)
      const data = await response.json()
      expect(data.models).toHaveLength(1)
      expect(data.models[0].name).toBe('qwen3:0.6b')
    })

    it('filters out embedding models by family pattern', async () => {
      const { requireAuth } = await import('../../../_lib/auth-guard')
      vi.mocked(requireAuth).mockReturnValueOnce(null)

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              models: [
                { name: 'custom-embedding-model', size: 123456, details: { family: 'bert' } },
                { name: 'qwen3:0.6b', size: 1234567 },
              ],
            }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ capabilities: ['embedding'] }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ capabilities: ['completion', 'chat'] }),
        } as unknown as Response)

      const request = createMockRequest('Bearer valid-token')
      const response = await GET(request)
      const data = await response.json()
      expect(data.models).toHaveLength(1)
      expect(data.models[0].name).toBe('qwen3:0.6b')
    })

    it('detects vision-capable models by name pattern', async () => {
      const { requireAuth } = await import('../../../_lib/auth-guard')
      vi.mocked(requireAuth).mockReturnValueOnce(null)

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              models: [
                { name: 'llava:latest', size: 123456 },
                { name: 'qwen3:0.6b', size: 1234567 },
              ],
            }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ capabilities: [] }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ capabilities: ['completion', 'chat'] }),
        } as unknown as Response)

      const request = createMockRequest('Bearer valid-token')
      const response = await GET(request)
      const data = await response.json()
      expect(data.models).toHaveLength(2)
      const llavaModel = data.models.find((m: any) => m.name === 'llava:latest')
      expect(llavaModel?.supportsVision).toBe(true)
    })

    it('detects vision-capable models by capabilities', async () => {
      const { requireAuth } = await import('../../../_lib/auth-guard')
      vi.mocked(requireAuth).mockReturnValueOnce(null)

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              models: [{ name: 'qwen3:0.6b', size: 1234567 }],
            }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ capabilities: ['vision', 'completion', 'chat'] }),
        } as unknown as Response)

      const request = createMockRequest('Bearer valid-token')
      const response = await GET(request)
      const data = await response.json()
      expect(data.models).toHaveLength(1)
      expect(data.models[0].supportsVision).toBe(true)
    })

    it('handles model with missing details gracefully', async () => {
      const { requireAuth } = await import('../../../_lib/auth-guard')
      vi.mocked(requireAuth).mockReturnValueOnce(null)

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              models: [{ name: 'unknown-model', size: 123456 }],
            }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ capabilities: ['completion', 'chat'] }),
        } as unknown as Response)

      const request = createMockRequest('Bearer valid-token')
      const response = await GET(request)
      const data = await response.json()
      expect(data.models).toHaveLength(1)
      expect(data.models[0].name).toBe('unknown-model')
      expect(data.models[0].family).toBeUndefined()
      expect(data.models[0].parameterSize).toBeUndefined()
    })

    it('handles fetch error for individual model show endpoint', async () => {
      const { requireAuth } = await import('../../../_lib/auth-guard')
      vi.mocked(requireAuth).mockReturnValueOnce(null)

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              models: [
                { name: 'model1', size: 123 },
                { name: 'model2', size: 456 },
              ],
            }),
        } as unknown as Response)
        .mockRejectedValueOnce(new Error('Network error')) // First show call fails
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ capabilities: ['completion', 'chat'] }),
        } as unknown as Response)

      const request = createMockRequest('Bearer valid-token')
      const response = await GET(request)
      const data = await response.json()
      // Should still return models even if one show call fails
      expect(data.models).toHaveLength(2)
    })

    it('returns models sorted alphabetically', async () => {
      const { requireAuth } = await import('../../../_lib/auth-guard')
      vi.mocked(requireAuth).mockReturnValueOnce(null)

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              models: [
                { name: 'zephyr', size: 123 },
                { name: 'alpha', size: 456 },
                { name: 'beta', size: 789 },
              ],
            }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ capabilities: ['completion', 'chat'] }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ capabilities: ['completion', 'chat'] }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ capabilities: ['completion', 'chat'] }),
        } as unknown as Response)

      const request = createMockRequest('Bearer valid-token')
      const response = await GET(request)
      const data = await response.json()
      expect(data.models[0].name).toBe('alpha')
      expect(data.models[1].name).toBe('beta')
      expect(data.models[2].name).toBe('zephyr')
    })

    it('returns available: false when Ollama is unavailable', async () => {
      const { requireAuth } = await import('../../../_lib/auth-guard')
      vi.mocked(requireAuth).mockReturnValueOnce(null)

      vi.mocked(global.fetch).mockRejectedValue(new Error('Ollama API error: 500'))

      const request = createMockRequest('Bearer valid-token')
      const response = await GET(request)
      const data = await response.json()
      expect(response.status).toBe(200) // Returns 200 with error info
      expect(data.models).toEqual([])
      expect(data.available).toBe(false)
      expect(data.error).toContain('Ollama API error')
    })

    it('filters out models with only embedding capability', async () => {
      const { requireAuth } = await import('../../../_lib/auth-guard')
      vi.mocked(requireAuth).mockReturnValueOnce(null)

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              models: [{ name: 'embedding-model', size: 123456 }],
            }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ capabilities: ['embedding'] }),
        } as unknown as Response)

      const request = createMockRequest('Bearer valid-token')
      const response = await GET(request)
      const data = await response.json()
      expect(data.models).toHaveLength(0)
    })
  })
})
