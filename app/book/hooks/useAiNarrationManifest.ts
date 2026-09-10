'use client'

import useSWR from 'swr'

interface AiNarrationManifestResponse {
  available: boolean
  pairs: number[]
}

async function fetchManifest(url: string): Promise<AiNarrationManifestResponse> {
  const response = await fetch(url)
  if (!response.ok) return { available: false, pairs: [] }
  const data = (await response.json()) as AiNarrationManifestResponse
  return {
    available: Boolean(data.available && data.pairs?.length),
    pairs: Array.isArray(data.pairs) ? data.pairs.map(Number).filter(Number.isFinite) : [],
  }
}

export function useAiNarrationManifest(
  bookId: string | undefined,
  chapterId: string | undefined,
  voice: string
): {
  available: boolean
  pairSet: Set<number>
  isLoading: boolean
} {
  const key =
    bookId && chapterId
      ? `/api/book-audio-manifest?book=${encodeURIComponent(bookId)}&chapter=${encodeURIComponent(chapterId)}&voice=${encodeURIComponent(voice)}`
      : null
  const { data, isLoading } = useSWR(key, fetchManifest)

  return {
    available: Boolean(data?.available),
    pairSet: new Set(data?.pairs ?? []),
    isLoading: Boolean(key && isLoading),
  }
}
