import { NextRequest, NextResponse } from 'next/server'
import { canUseAi } from '@/lib/ai/access'

interface AuthenticatedUser {
  id: number
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

  // 只接受完整的 Bearer 方案，不能把 Basic 或无前缀的凭据当成 Token。
  return authHeader.match(/^Bearer\s+(\S+)\s*$/i)?.[1] ?? null
}

function getSessionCookie(request: NextRequest): string | null {
  const cookieHeader = request.headers.get('cookie')
  return cookieHeader && cookieHeader.trim().length > 0 ? cookieHeader : null
}

function validateCookieRequestOrigin(request: NextRequest): NextResponse | null {
  if (!getSessionCookie(request) || ['GET', 'HEAD', 'OPTIONS'].includes(request.method ?? 'GET')) {
    return null
  }

  // Route Handler 没有 Server Action 的自动来源校验。Cookie 写请求必须来自本站。
  try {
    const origin = request.headers.get('origin')
    if (origin && new URL(origin).origin === new URL(request.url).origin) {
      return null
    }
  } catch {
    // 无效或缺失的来源按校验失败处理。
  }

  return NextResponse.json({ error: '禁止访问', message: '请求来源不合法' }, { status: 403 })
}

/**
 * Validate token against the Laravel backend.
 * Returns the user object if valid, or null if invalid.
 */
async function validateRequestWithBackend({
  token,
  cookie,
  request,
}: {
  token?: string | null
  cookie?: string | null
  request: NextRequest
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
      // Sanctum 通过可信前端来源启用会话中间件，单独转发 Cookie 不足以恢复会话。
      if (request.url) headers.Origin = new URL(request.url).origin
    }

    const response = await fetch(`${apiBaseUrl}/api/user`, {
      method: 'GET',
      headers,
      cache: 'no-store',
      redirect: 'error',
      // Add signal to prevent hanging
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      return null
    }

    const data: unknown = await response.json()
    // Laravel's AuthController returns ApiResponse::success($user), whose
    // production shape is { data: {...} }. Keep the older shapes compatible.
    if (!data || typeof data !== 'object') return null
    const payload = data as Record<string, unknown>
    const nested = payload.data
    const candidate =
      payload.user ||
      (nested && typeof nested === 'object' && 'user' in nested ? nested.user : nested) ||
      payload
    if (!candidate || typeof candidate !== 'object') return null
    const user = candidate as Record<string, unknown>
    if (typeof user.id !== 'number' && typeof user.id !== 'string') return null
    const id = Number(user.id)
    if (!Number.isSafeInteger(id) || id <= 0) return null
    return { id, is_admin: user.is_admin === true || user.is_admin === 1 || user.is_admin === '1' }
  } catch {
    // Network errors or timeout - fail closed (deny access) for security
    return null
  }
}

// Cache for validated tokens (prevents excessive backend calls)
// In production with multiple serverless instances, this is per-instance only
const tokenValidationCache = new Map<string, { user: AuthenticatedUser; timestamp: number }>()
const TOKEN_CACHE_TTL = 30 * 1000 // 30 seconds
const MAX_TOKEN_CACHE_SIZE = 1000

function cacheTokenUser(token: string, user: AuthenticatedUser): void {
  if (tokenValidationCache.size >= MAX_TOKEN_CACHE_SIZE) {
    const oldestKey = tokenValidationCache.keys().next().value
    if (oldestKey) tokenValidationCache.delete(oldestKey)
  }
  tokenValidationCache.set(token, { user, timestamp: Date.now() })
}

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
  const originError = validateCookieRequestOrigin(request)
  if (originError) return originError
  const token = validateAuthToken(request)
  const cookie = getSessionCookie(request)

  if (!token && !cookie) {
    return NextResponse.json({ error: '未授权', message: '请先登录' }, { status: 401 })
  }

  // Sanctum 优先使用 Cookie 身份，不得将其缓存到同时携带的任意 Token 下。
  if (token && !cookie) {
    cleanExpiredCache()
    const cached = tokenValidationCache.get(token)
    if (cached && Date.now() - cached.timestamp < TOKEN_CACHE_TTL) {
      return null
    }
  }

  const user = await validateRequestWithBackend({ token, cookie, request })
  if (!user) {
    return NextResponse.json(
      { error: '未授权', message: '登录已失效，请重新登录' },
      { status: 401 }
    )
  }

  if (token && !cookie) {
    cacheTokenUser(token, user)
  }

  return null
}

/**
 * Require admin - returns 403 JSON response if user is not an admin.
 * Must be called after requireAuth() returns null (meaning user is authenticated).
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const originError = validateCookieRequestOrigin(request)
  if (originError) return originError
  const token = validateAuthToken(request)
  const cookie = getSessionCookie(request)

  if (!token && !cookie) {
    return NextResponse.json({ error: '未授权', message: '请先登录' }, { status: 401 })
  }

  if (token && !cookie) {
    cleanExpiredCache()
    const cached = tokenValidationCache.get(token)
    if (cached && Date.now() - cached.timestamp < TOKEN_CACHE_TTL) {
      if (!cached.user.is_admin) {
        return NextResponse.json({ error: '禁止访问', message: '需要管理员权限' }, { status: 403 })
      }
      return null
    }
  }

  const user = await validateRequestWithBackend({ token, cookie, request })
  if (!user) {
    return NextResponse.json(
      { error: '未授权', message: '登录已失效，请重新登录' },
      { status: 401 }
    )
  }

  if (token && !cookie) {
    cacheTokenUser(token, user)
  }

  if (!user.is_admin) {
    return NextResponse.json({ error: '禁止访问', message: '需要管理员权限' }, { status: 403 })
  }

  return null
}

/** Only the primary administrator account (user ID 1) may use AI resources. */
export async function requireAiAccess(request: NextRequest): Promise<NextResponse | null> {
  const originError = validateCookieRequestOrigin(request)
  if (originError) return originError
  const token = validateAuthToken(request)
  const cookie = getSessionCookie(request)

  if (!token && !cookie) {
    return NextResponse.json({ error: '未授权', message: '请先登录' }, { status: 401 })
  }

  if (token && !cookie) {
    cleanExpiredCache()
    const cached = tokenValidationCache.get(token)
    if (cached && Date.now() - cached.timestamp < TOKEN_CACHE_TTL) {
      return canUseAi(cached.user)
        ? null
        : NextResponse.json(
            { error: '禁止访问', message: '仅管理员账号 ID 1 可使用 AI' },
            { status: 403 }
          )
    }
  }

  const user = await validateRequestWithBackend({ token, cookie, request })
  if (!user) {
    return NextResponse.json(
      { error: '未授权', message: '登录已失效，请重新登录' },
      { status: 401 }
    )
  }

  if (token && !cookie) {
    cacheTokenUser(token, user)
  }

  if (!canUseAi(user)) {
    return NextResponse.json(
      { error: '禁止访问', message: '仅管理员账号 ID 1 可使用 AI' },
      { status: 403 }
    )
  }

  return null
}
