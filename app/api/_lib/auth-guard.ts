import { NextRequest, NextResponse } from 'next/server'

interface AuthenticatedUser {
  is_admin: boolean
}

/**
 * Validates that the request has a valid Bearer token in the Authorization header.
 * Returns the token if valid, or null if missing/invalid/empty.
 *
 * Handles the case where the HTTP Headers class normalizes "Bearer " (with trailing
 * space) to "Bearer" — in that case, the token is considered absent/missing.
 */
export function validateAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    return null
  }

  // Strip "Bearer" prefix (case-insensitive), then trim whitespace
  const token = authHeader.replace(/^Bearer\s*/i, '').trim()

  // Reject empty or all-whitespace tokens
  if (!token) {
    return null
  }

  return token
}

function getSessionCookie(request: NextRequest): string | null {
  const cookieHeader = request.headers.get('cookie')
  return cookieHeader && cookieHeader.trim().length > 0 ? cookieHeader : null
}

/**
 * Validate token against the Laravel backend.
 * Returns the user object if valid, or null if invalid.
 */
async function validateRequestWithBackend({
  token,
  cookie,
}: {
  token?: string | null
  cookie?: string | null
}): Promise<AuthenticatedUser | null> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  try {
    const headers: HeadersInit = {
      Accept: 'application/json',
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    if (cookie) {
      headers.Cookie = cookie
    }

    const response = await fetch(`${apiBaseUrl}/api/user`, {
      method: 'GET',
      headers,
      // Add signal to prevent hanging
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    // Handle both { user: {...} } and direct user object formats
    const user = data.user || data
    return { is_admin: Boolean(user?.is_admin) }
  } catch {
    // Network errors or timeout - fail closed (deny access) for security
    return null
  }
}

// Cache for validated tokens (prevents excessive backend calls)
// In production with multiple serverless instances, this is per-instance only
const tokenValidationCache = new Map<string, { user: { is_admin: boolean }; timestamp: number }>()
const TOKEN_CACHE_TTL = 30 * 1000 // 30 seconds

/**
 * Clear expired cache entries
 */
function cleanExpiredCache(): void {
  const now = Date.now()
  for (const [key, value] of tokenValidationCache.entries()) {
    if (now - value.timestamp > TOKEN_CACHE_TTL) {
      tokenValidationCache.delete(key)
    }
  }
}

/**
 * Require auth - returns 401 JSON response if token is missing or invalid.
 * Validates the token against the Laravel backend for security.
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const token = validateAuthToken(request)
  const cookie = getSessionCookie(request)

  if (!token && !cookie) {
    return NextResponse.json({ error: '未授权', message: '请先登录' }, { status: 401 })
  }

  if (token) {
    cleanExpiredCache()
    const cached = tokenValidationCache.get(token)
    if (cached && Date.now() - cached.timestamp < TOKEN_CACHE_TTL) {
      return null
    }
  }

  const user = await validateRequestWithBackend({ token, cookie })
  if (!user) {
    return NextResponse.json(
      { error: '未授权', message: '登录已失效，请重新登录' },
      { status: 401 }
    )
  }

  if (token) {
    tokenValidationCache.set(token, { user, timestamp: Date.now() })
  }

  return null
}

/**
 * Require admin - returns 403 JSON response if user is not an admin.
 * Must be called after requireAuth() returns null (meaning user is authenticated).
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const token = validateAuthToken(request)
  const cookie = getSessionCookie(request)

  if (!token && !cookie) {
    return NextResponse.json({ error: '未授权', message: '请先登录' }, { status: 401 })
  }

  if (token) {
    cleanExpiredCache()
    const cached = tokenValidationCache.get(token)
    if (cached && Date.now() - cached.timestamp < TOKEN_CACHE_TTL) {
      if (!cached.user.is_admin) {
        return NextResponse.json({ error: '禁止访问', message: '需要管理员权限' }, { status: 403 })
      }
      return null
    }
  }

  const user = await validateRequestWithBackend({ token, cookie })
  if (!user) {
    return NextResponse.json(
      { error: '未授权', message: '登录已失效，请重新登录' },
      { status: 401 }
    )
  }

  if (token) {
    tokenValidationCache.set(token, { user, timestamp: Date.now() })
  }

  if (!user.is_admin) {
    return NextResponse.json({ error: '禁止访问', message: '需要管理员权限' }, { status: 403 })
  }

  return null
}
