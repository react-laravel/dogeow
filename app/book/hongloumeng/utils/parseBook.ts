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

/** 原文中「且……。」等短续句，在译文中常与上一句合并，先合并再对齐 */
export function mergeContinuationSentences(sentences: string[]): string[] {
  const result: string[] = []

  for (const sentence of sentences) {
    const previous = result.at(-1)
    if (previous && /^且.{1,14}。$/.test(sentence)) {
      result[result.length - 1] = previous + sentence
      continue
    }
    result.push(sentence)
  }

  return result
}

function normalizeForMatch(text: string): string {
  return text.replace(/[^\u4e00-\u9fff]/g, '')
}

/** 估算原文与译文句子的对应程度，用于断句不一致时合并对齐 */
export function scoreSentenceMatch(original: string, translation: string): number {
  const o = normalizeForMatch(original)
  const t = normalizeForMatch(translation)
  if (!o && !t) return 1
  if (!o || !t) return 0

  let hits = 0
  let total = 0
  for (let len = 3; len <= 6; len++) {
    for (let start = 0; start <= o.length - len; start++) {
      total++
      if (t.includes(o.slice(start, start + len))) hits++
    }
  }

  if (total === 0) return t.includes(o) ? 1 : 0
  return hits / total
}

/**
 * 原文/译文断句数量不一致时，合并相邻句子再配对。
 * 例如原文「千人一面。」与「且终不能不涉淫滥。」在译文中常为一句。
 */
export function alignSentencePairs(originals: string[], translations: string[]): SentencePair[] {
  const n = originals.length
  const m = translations.length

  if (n === 0 && m === 0) return []
  if (n === 0) return translations.map(t => ({ o: '', t }))
  if (m === 0) return originals.map(o => ({ o, t: '' }))
  if (n === m) return pairSentences(originals, translations)

  type DpCell = {
    score: number
    prevI: number
    prevJ: number
    mergeO: number
    mergeT: number
  }

  const dp: DpCell[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: m + 1 }, () => ({
      score: -Infinity,
      prevI: 0,
      prevJ: 0,
      mergeO: 0,
      mergeT: 0,
    }))
  )

  dp[0][0] = { score: 0, prevI: 0, prevJ: 0, mergeO: 0, mergeT: 0 }

  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      if (i === 0 && j === 0) continue

      let best: DpCell = { score: -Infinity, prevI: 0, prevJ: 0, mergeO: 0, mergeT: 0 }

      for (let mergeO = 1; mergeO <= Math.min(3, i); mergeO++) {
        for (let mergeT = 1; mergeT <= Math.min(3, j); mergeT++) {
          const prevI = i - mergeO
          const prevJ = j - mergeT
          const prev = dp[prevI][prevJ]
          if (prev.score === -Infinity) continue

          const o = originals.slice(prevI, i).join('')
          const t = translations.slice(prevJ, j).join('')
          const mergePenalty = mergeO + mergeT > 2 ? 0.03 : 0
          const score = prev.score + scoreSentenceMatch(o, t) - mergePenalty

          if (score > best.score) {
            best = { score, prevI, prevJ, mergeO, mergeT }
          }
        }
      }

      dp[i][j] = best
    }
  }

  const pairs: SentencePair[] = []
  let i = n
  let j = m

  while (i > 0 || j > 0) {
    const cell = dp[i][j]
    if (cell.mergeO === 0 && cell.mergeT === 0) break

    pairs.unshift({
      o: originals.slice(cell.prevI, i).join(''),
      t: translations.slice(cell.prevJ, j).join(''),
    })
    i = cell.prevI
    j = cell.prevJ
  }

  return pairs
}

export function stripTranslationPrefix(raw: string): string {
  return raw.replace(/^【译文】/, '').trim()
}

/** 拆分「第XX回 标题正文」，便于原文/译文回目前缀对齐 */
export function splitChapterHeading(title: string): { prefix: string; body: string } {
  const match = title.match(/^(第\S+)\s+(.*)$/)
  if (!match?.[2]) return { prefix: '', body: title }
  return { prefix: match[1], body: match[2] }
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
          ...alignSentencePairs(
            mergeContinuationSentences(splitChineseSentences(original)),
            splitChineseSentences(translation)
          )
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
