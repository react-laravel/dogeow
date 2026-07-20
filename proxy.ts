import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const HTML_REVALIDATE_HEADERS = {
  'Cache-Control': 'private, no-cache, max-age=0, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

function addRevalidateHeadersForHtml(request: NextRequest, response: NextResponse): NextResponse {
  const accept = request.headers.get('accept') ?? ''
  if (!accept.includes('text/html')) {
    return response
  }

  Object.entries(HTML_REVALIDATE_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  if (pathname === '/game/rpg' || pathname.startsWith('/game/rpg/')) {
    const suffix = pathname.slice('/game/rpg'.length) || '/'
    const target = new URL(suffix, 'https://rpg.dogeow.com')
    target.search = request.nextUrl.search
    return NextResponse.redirect(target, 308)
  }

  if (pathname === '/tool' && searchParams.get('tool') === 'moon-dice') {
    const target = new URL('/moon-dice', 'https://game.dogeow.com')
    target.search = request.nextUrl.search
    target.searchParams.delete('tool')
    return NextResponse.redirect(target, 308)
  }

  if (pathname === '/tool' && searchParams.get('tool') === 'repo-watch') {
    return NextResponse.redirect(new URL('/', 'https://repo-watch.dogeow.com'), 308)
  }

  if (pathname === '/game' || pathname.startsWith('/game/')) {
    const suffix = pathname.slice('/game'.length) || '/'
    const target = new URL(suffix, 'https://game.dogeow.com')
    target.search = request.nextUrl.search
    return NextResponse.redirect(target, 308)
  }

  return addRevalidateHeadersForHtml(request, NextResponse.next())
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\..*).*)'],
}
