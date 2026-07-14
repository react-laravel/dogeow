import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

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
  if (request.nextUrl.pathname === '/game/rpg') {
    return NextResponse.redirect('https://rpg.dogeow.com/', 308)
  }

  return addNoStoreHeadersForHtml(
    request,
    NextResponse.next()
  )
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\..*).*)'],
}
