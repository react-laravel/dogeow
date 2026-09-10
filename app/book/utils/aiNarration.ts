import catalog from '@/app/book/data/ai-narration.json'
import { getBookAssetBaseUrl } from '@/app/book/utils/registry'

export const AI_NARRATION_VOICES = [
  { id: 'serena', ttsName: 'Serena', label: 'Serena', description: '温柔女声' },
  { id: 'uncle_fu', ttsName: 'Uncle_Fu', label: 'Uncle Fu', description: '沉稳男声' },
] as const

export type AiNarrationVoiceId = (typeof AI_NARRATION_VOICES)[number]['id']

export interface AiNarrationChapterEntry {
  title?: string
  pairs?: number[]
  voices?: Record<string, number[]>
}

export interface AiNarrationCatalog {
  voice?: string
  defaultVoice?: string
  voices?: string[]
  chapters: Record<string, AiNarrationChapterEntry>
}

export const DEFAULT_AI_NARRATION_VOICE: AiNarrationVoiceId =
  catalog.defaultVoice === 'uncle_fu' ? 'uncle_fu' : 'serena'

export interface AiNarrationSource {
  bookId: string
  chapterId: string
  voice?: string
}

export function parseAiNarrationVoice(value: unknown): AiNarrationVoiceId {
  return value === 'uncle_fu' ? 'uncle_fu' : 'serena'
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

export function getAiNarrationPairIndexes(
  bookId: string,
  chapterId: string,
  voice: string = DEFAULT_AI_NARRATION_VOICE,
  data: AiNarrationCatalog = catalog
): number[] {
  const entry = getAiNarrationChapter(data, bookId, chapterId)
  if (!entry) return []
  const fromVoice = entry.voices?.[voice]
  if (fromVoice?.length) return fromVoice
  if (voice === 'serena' && entry.pairs?.length) return entry.pairs
  return []
}

export function hasAiNarrationAudio(
  bookId: string,
  chapterId: string,
  voice: string = DEFAULT_AI_NARRATION_VOICE,
  data: AiNarrationCatalog = catalog
): boolean {
  return getAiNarrationPairIndexes(bookId, chapterId, voice, data).length > 0
}

export function buildAiNarrationPairUrl(
  bookId: string,
  chapterId: string,
  pairIndex: number,
  voice: string = DEFAULT_AI_NARRATION_VOICE
): string {
  return `${getBookAssetBaseUrl(bookId)}/audio/${voice}/${chapterId}/${padNarrationPairIndex(pairIndex)}.mp3`
}

export function getAiNarrationPairUrl(
  bookId: string,
  chapterId: string,
  pairIndex: number,
  voice: string = DEFAULT_AI_NARRATION_VOICE,
  data: AiNarrationCatalog = catalog
): string | null {
  if (pairIndex < 0 || !hasAiNarrationAudio(bookId, chapterId, voice, data)) {
    return null
  }

  return buildAiNarrationPairUrl(bookId, chapterId, pairIndex, voice)
}

export function getAiNarrationManifestUrl(
  bookId: string,
  chapterId: string,
  voice: string = DEFAULT_AI_NARRATION_VOICE
): string {
  return `${getBookAssetBaseUrl(bookId)}/audio/${voice}/${chapterId}/manifest.json`
}
