import { NextRequest, NextResponse } from 'next/server'

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

/**
 * Validate token against the Laravel backend.
 * Returns the user object if valid, or null if invalid.
 */
async function validateTokenWithBackend(token: string): Promise<{ is_admin: boolean } | null> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  try {
    const response = await fetch(`${apiBaseUrl}/api/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
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
const TOKEN_CACHE_TTL = 5 * 1000 // 5 seconds — short TTL to minimize TOCTOU window for privilege changes
const ADMIN_CACHE_TTL = 5 * 1000 // 5 seconds — shorter TTL for admin checks to reduce time window after privilege revocation
const MAX_CACHE_SIZE = 1000 // Maximum number of cached tokens to prevent memory exhaustion DoS

/**
 * Clear expired cache entries and enforce size limit (LRU eviction)
 */
function cleanExpiredCache(): void {
  const now = Date.now()

  // First pass: remove expired entries
  for (const [key, value] of tokenValidationCache.entries()) {
    if (now - value.timestamp > TOKEN_CACHE_TTL) {
      tokenValidationCache.delete(key)
    }
  }

  // Second pass: if still over limit, evict oldest entries (LRU)
  if (tokenValidationCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(tokenValidationCache.entries())
    // Sort by timestamp ascending (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    // Remove oldest entries until under limit
    const toRemove = entries.slice(0, tokenValidationCache.size - MAX_CACHE_SIZE + 1)
    for (const [key] of toRemove) {
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
  if (!token) {
    return NextResponse.json(
      { error: '未授权', message: '请先登录或提供有效的认证令牌' },
      { status: 401 }
    )
  }

  // Check cache first
  cleanExpiredCache()
  const cached = tokenValidationCache.get(token)
  if (cached && Date.now() - cached.timestamp < TOKEN_CACHE_TTL) {
    // Token was recently validated, allow access
    return null
  }

  // Validate token against backend
  const user = await validateTokenWithBackend(token)
  if (!user) {
    return NextResponse.json(
      { error: '未授权', message: '令牌无效或已过期，请重新登录' },
      { status: 401 }
    )
  }

  // Cache the validated token
  tokenValidationCache.set(token, { user, timestamp: Date.now() })

  return null
}

/**
 * Require admin - returns 403 JSON response if user is not an admin.
 * Must be called after requireAuth() returns null (meaning user is authenticated).
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const token = validateAuthToken(request)
  if (!token) {
    return NextResponse.json(
      { error: '未授权', message: '请先登录或提供有效的认证令牌' },
      { status: 401 }
    )
  }

  // Check cache for admin status
  cleanExpiredCache()
  const cached = tokenValidationCache.get(token)
  if (cached && Date.now() - cached.timestamp < TOKEN_CACHE_TTL) {
    if (!cached.user.is_admin) {
      return NextResponse.json({ error: '禁止访问', message: '需要管理员权限' }, { status: 403 })
    }
    return null
  }

  // Validate token and get user info from backend
  const user = await validateTokenWithBackend(token)
  if (!user) {
    return NextResponse.json(
      { error: '未授权', message: '令牌无效或已过期，请重新登录' },
      { status: 401 }
    )
  }

  // Cache the validated token
  tokenValidationCache.set(token, { user, timestamp: Date.now() })

  if (!user.is_admin) {
    return NextResponse.json({ error: '禁止访问', message: '需要管理员权限' }, { status: 403 })
  }

  return null
}
