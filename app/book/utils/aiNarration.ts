import catalog from '@/app/book/data/ai-narration.json'
import { getBookAssetBaseUrl } from '@/app/book/utils/registry'

export interface AiNarrationChapterEntry {
  title?: string
  pairs: number[]
}

export interface AiNarrationCatalog {
  voice?: string
  chapters: Record<string, AiNarrationChapterEntry>
}

export const DEFAULT_AI_NARRATION_VOICE = catalog.voice || 'serena'

export interface AiNarrationSource {
  bookId: string
  chapterId: string
  voice?: string
}

export function chapterNarrationKey(bookId: string, chapterId: string): string {
  return `${bookId}:${chapterId}`
}

export function padNarrationPairIndex(pairIndex: number): string {
  return String(pairIndex).padStart(3, '0')
}

export function getAiNarrationChapter(
  data: AiNarrationCatalog,
  bookId: string,
  chapterId: string
): AiNarrationChapterEntry | null {
  return data.chapters[chapterNarrationKey(bookId, chapterId)] ?? null
}

export function hasAiNarrationAudio(
  bookId: string,
  chapterId: string,
  data: AiNarrationCatalog = catalog
): boolean {
  return Boolean(getAiNarrationChapter(data, bookId, chapterId)?.pairs.length)
}

export function getAiNarrationPairIndexes(
  bookId: string,
  chapterId: string,
  data: AiNarrationCatalog = catalog
): number[] {
  return getAiNarrationChapter(data, bookId, chapterId)?.pairs ?? []
}

export function getAiNarrationPairUrl(
  bookId: string,
  chapterId: string,
  pairIndex: number,
  voice = DEFAULT_AI_NARRATION_VOICE,
  data: AiNarrationCatalog = catalog
): string | null {
  if (!hasAiNarrationAudio(bookId, chapterId, data) || pairIndex < 0) {
    return null
  }

  return `${getBookAssetBaseUrl(bookId)}/audio/${voice}/${chapterId}/${padNarrationPairIndex(pairIndex)}.mp3`
}
