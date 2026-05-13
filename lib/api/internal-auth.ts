'use client'

import useAuthStore from '@/stores/authStore'

/**
 * Fetch a same-origin Next.js API route with the current SPA auth token.
 *
 * These routes are protected by app/api/_lib/auth-guard.ts, which validates
 * either Laravel session cookies or an Authorization Bearer token. Browser
 * fetches to same-origin routes include cookies by default, but our SPA login
 * primarily persists a Bearer token, so protected internal routes must forward it.
 */
export async function authenticatedInternalFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = useAuthStore.getState().token
  const headers = new Headers(init.headers)

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: init.credentials ?? 'include',
  })
}
