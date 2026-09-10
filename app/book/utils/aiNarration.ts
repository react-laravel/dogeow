import catalog from '@/app/book/data/ai-narration.json'
import { getBookAssetBaseUrl } from '@/app/book/utils/registry'

export const AI_NARRATION_VOICES = [
  {
    id: 'vivian',
    ttsName: 'Vivian',
    label: 'Vivian · 明亮女声',
    description: '明亮中文女声',
  },
  {
    id: 'serena',
    ttsName: 'Serena',
    label: 'Serena · 温柔女声',
    description: '温柔中文女声',
  },
  {
    id: 'uncle_fu',
    ttsName: 'Uncle_Fu',
    label: 'Uncle Fu · 成熟男声',
    description: '成熟偏年长的中文男声',
  },
] as const

// New preset recordings have a separate release, so old design voices and
// cached recordings cannot be served under the new labels.
export const AI_NARRATION_RELEASES: Readonly<Record<string, string>> = {
  luxun: 'presets-1.7b-v1',
}

function getAiNarrationBaseUrl(bookId: string): string {
  const release = AI_NARRATION_RELEASES[bookId]
  return `${getBookAssetBaseUrl(bookId)}/audio${release ? `/${release}` : ''}`
}

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
  audioReleases?: Record<string, string>
  chapters: Record<string, AiNarrationChapterEntry>
}

export const DEFAULT_AI_NARRATION_VOICE: AiNarrationVoiceId = parseAiNarrationVoice(
  catalog.defaultVoice
)

export interface AiNarrationSource {
  bookId: string
  chapterId: string
  voice?: string
}

export function parseAiNarrationVoice(value: unknown): AiNarrationVoiceId {
  if (value === 'young_male') return 'uncle_fu'
  if (value === 'young_female') return 'vivian'
  return AI_NARRATION_VOICES.find(voice => voice.id === value)?.id ?? 'serena'
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
  const release = AI_NARRATION_RELEASES[bookId]
  if (release && data.audioReleases?.[bookId] !== release) return []
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
  return `${getAiNarrationBaseUrl(bookId)}/${voice}/${chapterId}/${padNarrationPairIndex(pairIndex)}.mp3`
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
  return `${getAiNarrationBaseUrl(bookId)}/${voice}/${chapterId}/manifest.json`
}
