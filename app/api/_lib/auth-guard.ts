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
 * Require auth - returns 401 JSON response if token is missing.
 * Use validateAuthToken() first if you need the token for anything other than existence check.
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const token = validateAuthToken(request)
  if (!token) {
    return NextResponse.json(
      { error: '未授权', message: '请先登录或提供有效的认证令牌' },
      { status: 401 }
    )
  }
  return null
}
