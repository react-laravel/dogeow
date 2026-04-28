import { beforeEach, describe, expect, it, vi } from 'vitest'
import useAuthStore from '@/stores/authStore'
import { apiRequest } from '../core'

const websocketMocks = vi.hoisted(() => ({
  getEchoInstance: vi.fn(() => null),
}))

vi.mock('@/lib/websocket', () => ({
  getEchoInstance: websocketMocks.getEchoInstance,
}))

describe('core apiRequest csrf retry integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      writable: true,
      value: '',
    })

    useAuthStore.setState({
      token: 'auth-token',
      user: null,
      loading: false,
      isAuthenticated: true,
    })
  })

  it('rebuilds request headers after refreshing the csrf cookie', async () => {
    let csrfRefreshCount = 0

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.endsWith('/sanctum/csrf-cookie')) {
        csrfRefreshCount += 1
        Object.defineProperty(document, 'cookie', {
          configurable: true,
          writable: true,
          value: `XSRF-TOKEN=${csrfRefreshCount === 1 ? 'stale-token' : 'fresh-token'}`,
        })

        return new Response(null, { status: 204 })
      }

      const headers = new Headers(init?.headers)
      const xsrfToken = headers.get('X-XSRF-TOKEN')

      if (xsrfToken === 'stale-token') {
        return new Response(null, { status: 419 })
      }

      expect(xsrfToken).toBe('fresh-token')

      return new Response(JSON.stringify({ success: true, data: { ok: true } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    vi.stubGlobal('fetch', fetchMock)

    const response = await apiRequest<{ ok: boolean }>(
      'chat/rooms',
      'POST',
      { hello: 'world' },
      {
        handleError: false,
      }
    )

    expect(response).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })
})
