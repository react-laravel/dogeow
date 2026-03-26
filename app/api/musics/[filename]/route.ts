import { NextRequest } from 'next/server'
import { requireAuth } from '@/app/api/_lib/auth-guard'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    filename: string
  }>
}

function normalizeBaseUrl(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function buildMusicSourceUrl(filename: string) {
  const assetBaseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_ASSET_BASE_URL?.trim() || 'https://upyun.dogeow.com'
  )

  return `${assetBaseUrl}/music/${encodeURIComponent(safeDecode(filename))}`
}

function copyHeaderIfPresent(target: Headers, source: Headers, headerName: string) {
  const value = source.get(headerName)
  if (value) {
    target.set(headerName, value)
  }
}

async function proxyMusic(request: NextRequest, context: RouteContext) {
  const { filename } = await context.params
  const sourceUrl = buildMusicSourceUrl(filename)

  const upstreamHeaders = new Headers()
  copyHeaderIfPresent(upstreamHeaders, request.headers, 'range')
  copyHeaderIfPresent(upstreamHeaders, request.headers, 'if-none-match')
  copyHeaderIfPresent(upstreamHeaders, request.headers, 'if-modified-since')
  copyHeaderIfPresent(upstreamHeaders, request.headers, 'accept')

  const upstreamResponse = await fetch(sourceUrl, {
    headers: upstreamHeaders,
    redirect: 'follow',
  })

  if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: upstreamResponse.headers,
    })
  }

  const responseHeaders = new Headers()
  copyHeaderIfPresent(responseHeaders, upstreamResponse.headers, 'accept-ranges')
  copyHeaderIfPresent(responseHeaders, upstreamResponse.headers, 'cache-control')
  copyHeaderIfPresent(responseHeaders, upstreamResponse.headers, 'content-length')
  copyHeaderIfPresent(responseHeaders, upstreamResponse.headers, 'content-range')
  copyHeaderIfPresent(responseHeaders, upstreamResponse.headers, 'content-type')
  copyHeaderIfPresent(responseHeaders, upstreamResponse.headers, 'etag')
  copyHeaderIfPresent(responseHeaders, upstreamResponse.headers, 'last-modified')

  if (!responseHeaders.has('content-type')) {
    responseHeaders.set('content-type', 'audio/mpeg')
  }

  responseHeaders.set(
    'content-disposition',
    `inline; filename*=UTF-8''${encodeURIComponent(safeDecode(filename))}`
  )

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  })
}

export async function GET(request: NextRequest, context: RouteContext) {
  // Auth guard: require valid Bearer token to prevent unauthorized music file access (IDOR)
  const authError = await requireAuth(request)
  if (authError) return authError

  return proxyMusic(request, context)
}
