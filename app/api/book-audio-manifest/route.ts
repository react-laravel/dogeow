import { NextResponse } from 'next/server'
import { getAiNarrationManifestUrl } from '@/app/book/utils/aiNarration'

function isSafeId(value: string, pattern: RegExp): boolean {
  return pattern.test(value)
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get('book') ?? ''
  const chapterId = searchParams.get('chapter') ?? ''
  const voice = (searchParams.get('voice') ?? 'serena').toLowerCase()

  if (
    !isSafeId(bookId, /^[a-z0-9]+$/) ||
    !isSafeId(chapterId, /^[A-Za-z0-9._-]+$/) ||
    !isSafeId(voice, /^[a-z0-9_]+$/)
  ) {
    return NextResponse.json({ available: false, pairs: [] }, { status: 400 })
  }

  const manifestUrl = getAiNarrationManifestUrl(bookId, chapterId, voice)
  try {
    const response = await fetch(manifestUrl, { cache: 'no-store' })
    if (!response.ok) {
      return NextResponse.json({ available: false, pairs: [] })
    }
    const payload = (await response.json()) as { pairs?: Array<{ index?: number } | number> }
    const pairs = (payload.pairs ?? [])
      .map(item => (typeof item === 'number' ? item : item.index))
      .filter((index): index is number => typeof index === 'number' && Number.isFinite(index))

    return NextResponse.json({ available: pairs.length > 0, pairs })
  } catch {
    return NextResponse.json({ available: false, pairs: [] })
  }
}
