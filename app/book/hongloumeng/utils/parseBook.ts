export const SENTENCE_ENDINGS = new Set(['。', '！', '？', '；'])

export interface SentencePair {
  o: string
  t: string
}

export interface BookChapter {
  id: number
  title: string
  translationTitle: string
  pairs: SentencePair[]
}

export interface BookChapterMeta {
  id: number
  title: string
  translationTitle: string
  pairCount: number
  file: string
}

export interface BookIndex {
  title: string
  chapterCount: number
  pairCount: number
  chapters: BookChapterMeta[]
}

export function splitChineseSentences(text: string): string[] {
  const normalized = text.replace(/^[　\s]+/, '').trim()
  if (!normalized) return []

  const sentences: string[] = []
  let buf = ''
  for (const char of normalized) {
    buf += char
    if (SENTENCE_ENDINGS.has(char)) {
      sentences.push(buf.trim())
      buf = ''
    }
  }
  if (buf.trim()) sentences.push(buf.trim())
  return sentences
}

export function pairSentences(originals: string[], translations: string[]): SentencePair[] {
  const max = Math.max(originals.length, translations.length, 0)
  const pairs: SentencePair[] = []
  for (let i = 0; i < max; i++) {
    const o = originals[i] ?? ''
    const t = translations[i] ?? ''
    if (o || t) pairs.push({ o, t })
  }
  return pairs
}

export function stripTranslationPrefix(raw: string): string {
  return raw.replace(/^【译文】/, '').trim()
}

export function parseHongloumengText(content: string): BookChapter[] {
  const lines = content.split(/\r?\n/)
  const chapters: BookChapter[] = []
  let current: BookChapter | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    if (/^第\d+章/.test(line)) {
      if (current) chapters.push(current)
      current = {
        id: chapters.length + 1,
        title: line,
        translationTitle: '',
        pairs: [],
      }
      continue
    }

    if (!current) continue

    if (line.startsWith('【译文】')) {
      const translationOnly = stripTranslationPrefix(line)
      if (
        translationOnly &&
        current.pairs.length === 0 &&
        !current.translationTitle &&
        /^第.+回/.test(translationOnly)
      ) {
        current.translationTitle = translationOnly
        continue
      }
      if (translationOnly) {
        current.pairs.push({ o: '', t: translationOnly })
      }
      continue
    }

    const original = line
    const nextLine = (lines[i + 1] ?? '').trim()

    if (nextLine.startsWith('【译文】')) {
      const translation = stripTranslationPrefix(nextLine)
      if (!current.translationTitle && current.pairs.length === 0 && /^第.+回/.test(translation)) {
        current.translationTitle = translation
      } else {
        current.pairs.push(
          ...pairSentences(splitChineseSentences(original), splitChineseSentences(translation))
        )
      }
      i++
      continue
    }

    for (const o of splitChineseSentences(original)) {
      current.pairs.push({ o, t: '' })
    }
  }

  if (current) chapters.push(current)
  return chapters
}
