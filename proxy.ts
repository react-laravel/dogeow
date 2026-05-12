import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { resolveSiteVariant } from '@/lib/siteVariant'

const RPG_INTERNAL_PATH = '/rpg-host'
const HTML_NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  Pragma: 'no-cache',
  Expires: '0',
}

function addNoStoreHeadersForHtml(request: NextRequest, response: NextResponse): NextResponse {
  const accept = request.headers.get('accept') ?? ''
  if (!accept.includes('text/html')) {
    return response
  }

  Object.entries(HTML_NO_STORE_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  const host = requestHeaders.get('host')
  const siteVariant = resolveSiteVariant(host)
  const isRpgRequest =
    siteVariant === 'rpg' || request.nextUrl.pathname.startsWith(RPG_INTERNAL_PATH)

  if (isRpgRequest) {
    requestHeaders.set('x-site-variant', 'rpg')
  }

  if (siteVariant !== 'rpg') {
    return addNoStoreHeadersForHtml(
      request,
      NextResponse.next({
        request: { headers: requestHeaders },
      })
    )
  }

  const url = request.nextUrl.clone()

  if (url.pathname === '/' || url.pathname === '/game/rpg') {
    url.pathname = RPG_INTERNAL_PATH
    return addNoStoreHeadersForHtml(
      request,
      NextResponse.rewrite(url, {
        request: { headers: requestHeaders },
      })
    )
  }

  return addNoStoreHeadersForHtml(
    request,
    NextResponse.next({
      request: { headers: requestHeaders },
    })
  )
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\..*).*)'],
}
