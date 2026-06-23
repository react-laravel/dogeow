import { describe, expect, it, vi, beforeEach } from 'vitest'
import { authenticatedInternalFetch } from '../internal-auth'

// Use vi.hoisted to create mock functions before module loading
const { mockGetState } = vi.hoisted(() => {
  const state = { token: 'internal-auth-token', user: null }
  return {
    mockGetState: vi.fn(() => ({ ...state })),
    setState: (newState: Partial<typeof state>) => {
      Object.assign(state, newState)
    },
  }
})

// Mock auth store - useAuthStore is a Zustand hook with getState method
vi.mock('@/stores/authStore', () => ({
  default: Object.assign(() => mockGetState(), {
    getState: mockGetState,
    setState: vi.fn(),
    subscribe: vi.fn(),
    destroy: vi.fn(),
  }),
}))

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('internal-auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    // Reset to default token
    ;(mockGetState as ReturnType<typeof vi.fn>).mockReturnValue({
      token: 'internal-auth-token',
      user: null,
    })
  })

  it('should make a fetch request with default options', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response)

    await authenticatedInternalFetch('/api/internal/test')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/internal/test',
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })

  it('should include Authorization header when token exists', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response)

    await authenticatedInternalFetch('/api/internal/test')

    const callArgs = mockFetch.mock.calls[0][1]
    expect(callArgs.headers.get('Authorization')).toBe('Bearer internal-auth-token')
  })

  it('should not include Authorization header when token is null', async () => {
    mockGetState.mockReturnValue({
      token: null,
      user: null,
    })

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response)

    await authenticatedInternalFetch('/api/internal/test')

    const callArgs = mockFetch.mock.calls[0][1]
    expect(callArgs.headers.has('Authorization')).toBe(false)
  })

  it('should not override existing Authorization header', async () => {
    mockGetState.mockReturnValue({
      token: 'internal-auth-token',
      user: null,
    })

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response)

    await authenticatedInternalFetch('/api/internal/test', {
      headers: {
        Authorization: 'Bearer custom-token',
      },
    })

    const callArgs = mockFetch.mock.calls[0][1]
    expect(callArgs.headers.get('Authorization')).toBe('Bearer custom-token')
  })

  it('should use provided credentials', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response)

    await authenticatedInternalFetch('/api/internal/test', {
      credentials: 'same-origin',
    })

    const callArgs = mockFetch.mock.calls[0][1]
    expect(callArgs.credentials).toBe('same-origin')
  })

  it('should default credentials to include', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response)

    await authenticatedInternalFetch('/api/internal/test', {})

    const callArgs = mockFetch.mock.calls[0][1]
    expect(callArgs.credentials).toBe('include')
  })

  it('should pass through other fetch options', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response)

    await authenticatedInternalFetch('/api/internal/test', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
    })

    const callArgs = mockFetch.mock.calls[0][1]
    expect(callArgs.method).toBe('POST')
    expect(callArgs.body).toBe(JSON.stringify({ key: 'value' }))
  })

  it('should merge custom headers with auth header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response)

    await authenticatedInternalFetch('/api/internal/test', {
      headers: {
        'X-Custom-Header': 'custom-value',
      },
    })

    const callArgs = mockFetch.mock.calls[0][1]
    expect(callArgs.headers.get('Authorization')).toBe('Bearer internal-auth-token')
    expect(callArgs.headers.get('X-Custom-Header')).toBe('custom-value')
  })

  it('should return the fetch response', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ data: 'test' }),
    } as unknown as Response

    mockFetch.mockResolvedValue(mockResponse)

    const response = await authenticatedInternalFetch('/api/internal/test')

    expect(response).toBe(mockResponse)
    expect(response.ok).toBe(true)
  })

  it('should handle empty token (empty string)', async () => {
    mockGetState.mockReturnValue({
      token: '',
      user: null,
    })

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response)

    await authenticatedInternalFetch('/api/internal/test')

    const callArgs = mockFetch.mock.calls[0][1]
    // Empty string is falsy, so should not include Authorization
    expect(callArgs.headers.has('Authorization')).toBe(false)
  })
})
