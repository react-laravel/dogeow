import { API_URL } from './url'

const SAFE_HTTP_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

let csrfCookiePromise: Promise<void> | null = null

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function getXsrfTokenFromCookie(): string | null {
  return getCookieValue('XSRF-TOKEN')
}

export async function ensureBrowserCsrfCookie(force = false): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  if (!force && getXsrfTokenFromCookie()) {
    return
  }

  if (!csrfCookiePromise) {
    csrfCookiePromise = fetch(`${API_URL}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('获取 CSRF Cookie 失败')
        }
      })
      .finally(() => {
        csrfCookiePromise = null
      })
  }

  await csrfCookiePromise
}

interface AuthenticatedBrowserFetchInit extends RequestInit {
  token?: string | null
}

export async function authenticatedBrowserFetch(
  input: RequestInfo | URL,
  init: AuthenticatedBrowserFetchInit = {},
  retryOnCsrfMismatch = true
): Promise<Response> {
  const { token, headers: rawHeaders, method = 'GET', body, ...rest } = init
  const normalizedMethod = method.toUpperCase()

  if (typeof window !== 'undefined' && !SAFE_HTTP_METHODS.has(normalizedMethod)) {
    await ensureBrowserCsrfCookie()
  }

  const headers = new Headers(rawHeaders)

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  if (!headers.has('X-Requested-With')) {
    headers.set('X-Requested-With', 'XMLHttpRequest')
  }

  if (body && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (!SAFE_HTTP_METHODS.has(normalizedMethod)) {
    const xsrfToken = getXsrfTokenFromCookie()
    if (xsrfToken && !headers.has('X-XSRF-TOKEN')) {
      headers.set('X-XSRF-TOKEN', xsrfToken)
    }
  }

  const response = await fetch(input, {
    ...rest,
    method: normalizedMethod,
    body,
    headers,
    credentials: 'include',
  })

  if (
    retryOnCsrfMismatch &&
    typeof window !== 'undefined' &&
    !SAFE_HTTP_METHODS.has(normalizedMethod) &&
    response.status === 419
  ) {
    await ensureBrowserCsrfCookie(true)
    return authenticatedBrowserFetch(input, init, false)
  }

  return response
}
