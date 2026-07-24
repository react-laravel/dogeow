import { post } from '@/lib/api'

/**
 * Translate text via Laravel proxy (MyMemory upstream).
 */
export async function translateEnToZh(text: string): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) return ''

  const result = await post<{ text: string }>(
    'word/translate',
    { text: trimmed, langpair: 'en|zh' },
    { handleError: false }
  )

  return result?.text?.trim() || trimmed
}
