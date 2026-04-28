import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBrowserRequestHeaders, executeBrowserRequestWithCsrf } from '../browser-request'

describe('browser-request helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      writable: true,
      value: '',
    })
  })

  it('creates browser headers with shared auth, xsrf and socket metadata', () => {
    const headers = createBrowserRequestHeaders({
      method: 'POST',
      token: 'auth-token',
      xsrfToken: 'csrf-token',
      socketId: 'socket-123',
    })

    expect(headers.get('Accept')).toBe('application/json')
    expect(headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('Authorization')).toBe('Bearer auth-token')
    expect(headers.get('X-XSRF-TOKEN')).toBe('csrf-token')
    expect(headers.get('X-Socket-ID')).toBe('socket-123')
  })

  it('does not force content-type for form data requests', () => {
    const headers = createBrowserRequestHeaders({
      method: 'POST',
      isFormData: true,
    })

    expect(headers.has('Content-Type')).toBe(false)
  })

  it('retries unsafe requests once after a csrf mismatch', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    const executeRequest = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(new Response(null, { status: 419 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))

    const response = await executeBrowserRequestWithCsrf('POST', executeRequest)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(executeRequest).toHaveBeenCalledTimes(2)
    expect(response.status).toBe(200)
  })
})
