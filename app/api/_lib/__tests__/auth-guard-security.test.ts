import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { requireAdmin, requireAiAccess, requireAuth, validateAuthToken } from '../auth-guard'

const authenticatedResponse = (user: unknown) => Response.json({ data: user })

afterEach(() => vi.restoreAllMocks())

describe('authentication boundaries', () => {
  it.each(['Basic abc', 'abc', 'Bearertoken', 'Bearer two tokens'])(
    'rejects invalid scheme %s',
    header => {
      const request = new NextRequest('https://dogeow.com/api/test', {
        headers: { Authorization: header },
      })
      expect(validateAuthToken(request)).toBeNull()
    }
  )

  it('does not promote a cookie session into a reusable arbitrary token', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(authenticatedResponse({ id: 1, is_admin: true }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
    const url = 'https://dogeow.com/api/test'
    const headers = {
      Authorization: 'Bearer cookie-poison-regression',
      Cookie: 'laravel_session=example',
    }

    expect(await requireAdmin(new NextRequest(url, { headers }))).toBeNull()
    const response = await requireAdmin(
      new NextRequest(url, { headers: { Authorization: headers.Authorization } })
    )

    expect(response?.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not reuse a token-only identity when a different cookie is present', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(authenticatedResponse({ id: 1, is_admin: true }))
      .mockResolvedValueOnce(authenticatedResponse({ id: 2, is_admin: false }))
    const url = 'https://dogeow.com/api/test'
    const Authorization = 'Bearer identity-mismatch-regression'
    expect(await requireAdmin(new NextRequest(url, { headers: { Authorization } }))).toBeNull()
    const response = await requireAdmin(
      new NextRequest(url, { headers: { Authorization, Cookie: 'laravel_session=other' } })
    )
    expect(response?.status).toBe(403)
  })

  it.each([null, {}, { id: 'NaN' }, { id: true }, { id: 0 }, { id: -1 }, { id: 1.5 }])(
    'rejects malformed backend user %j',
    async user => {
      vi.spyOn(global, 'fetch').mockResolvedValue(authenticatedResponse(user))
      const request = new NextRequest('https://dogeow.com/api/test', {
        headers: { Cookie: 'laravel_session=malformed' },
      })
      expect((await requireAuth(request))?.status).toBe(401)
    }
  )

  it('does not interpret the string false as administrator access', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(authenticatedResponse({ id: 2, is_admin: 'false' }))
    const request = new NextRequest('https://dogeow.com/api/test', {
      headers: { Cookie: 'laravel_session=string-role' },
    })
    expect((await requireAdmin(request))?.status).toBe(403)
  })

  it.each([requireAuth, requireAdmin, requireAiAccess])(
    'blocks foreign-origin cookie writes in every guard',
    async guard => {
      const fetchMock = vi.spyOn(global, 'fetch')
      const request = new NextRequest('https://dogeow.com/api/test', {
        method: 'POST',
        headers: { Cookie: 'laravel_session=example', Origin: 'https://other.example' },
      })
      expect((await guard(request))?.status).toBe(403)
      expect(fetchMock).not.toHaveBeenCalled()
    }
  )

  it('accepts same-origin cookie writes and opts out of backend caching', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(authenticatedResponse({ id: 1, is_admin: true }))
    const request = new NextRequest('https://dogeow.com/api/test', {
      method: 'POST',
      headers: { Cookie: 'laravel_session=example', Origin: 'https://dogeow.com' },
    })
    expect(await requireAiAccess(request)).toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        cache: 'no-store',
        redirect: 'error',
        headers: expect.objectContaining({
          Origin: 'https://dogeow.com',
          Cookie: 'laravel_session=example',
        }),
      })
    )
  })

  it('rejects cookie writes without an Origin header', async () => {
    const request = new NextRequest('https://dogeow.com/api/test', {
      method: 'DELETE',
      headers: { Cookie: 'laravel_session=example' },
    })
    expect((await requireAuth(request))?.status).toBe(403)
  })
})
