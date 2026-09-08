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

describe('request timer cleanup', () => {
  it('clears the timer after success and does not abort a completed request', async () => {
    vi.useFakeTimers()
    try {
      const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: [], success: true }))
      vi.stubGlobal('fetch', fetchMock)
      await apiRequest('notes', 'GET', undefined, { handleError: false })
      expect(vi.getTimerCount()).toBe(0)
      await vi.advanceTimersByTimeAsync(60000)
      expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false)
    } finally {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    }
  })

  it('clears the timer when fetch fails', async () => {
    vi.useFakeTimers()
    try {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
      await expect(apiRequest('notes', 'GET', undefined, { handleError: false })).rejects.toThrow(
        '网络连接失败'
      )
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    }
  })

  it('aborts a stalled request at the deadline', async () => {
    vi.useFakeTimers()
    try {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          (_url: unknown, init: RequestInit) =>
            new Promise((_resolve, reject) => {
              init.signal?.addEventListener('abort', () =>
                reject(new DOMException('aborted', 'AbortError'))
              )
            })
        )
      )
      const assertion = expect(
        apiRequest('notes', 'GET', undefined, { handleError: false })
      ).rejects.toThrow('请求超时')
      await vi.advanceTimersByTimeAsync(30000)
      await assertion
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    }
  })
})
