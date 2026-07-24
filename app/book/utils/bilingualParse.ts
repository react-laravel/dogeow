export const SENTENCE_ENDINGS = new Set(['。', '！', '？', '；'])

const MAX_ALIGN_MERGE = 3
const NGRAM_MIN = 3
const NGRAM_MAX = 6
const MIN_LENGTH_RATIO = 0.15
const CHAPTER_START_RE = /^第\d+章/
const CHAPTER_TITLE_RE = /^第.+回/
const CONTINUATION_RE = /^且.{1,14}。$/
const TRANSLATION_PREFIX = '【译文】'

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
  let buffer = ''

  for (const char of normalized) {
    buffer += char
    if (!SENTENCE_ENDINGS.has(char)) continue
    sentences.push(buffer.trim())
    buffer = ''
  }

  if (buffer.trim()) sentences.push(buffer.trim())
  return sentences
}

export function pairSentences(originals: string[], translations: string[]): SentencePair[] {
  const max = Math.max(originals.length, translations.length)
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
    if (previous && CONTINUATION_RE.test(sentence)) {
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

  // 按较短文本长度归一化，避免子串匹配虚高
  const lenRatio = Math.min(o.length, t.length) / Math.max(o.length, t.length)
  if (lenRatio < MIN_LENGTH_RATIO) return 0

  let hits = 0
  let total = 0
  for (let len = NGRAM_MIN; len <= NGRAM_MAX; len++) {
    for (let start = 0; start <= o.length - len; start++) {
      total++
      if (t.includes(o.slice(start, start + len))) hits++
    }
  }

  if (total === 0) return t.includes(o) ? lenRatio : 0
  return (hits / total) * lenRatio
}

/** 合并偏好：1:1 最优；优先合并原文；译文合并与单侧孤儿都有惩罚 */
function mergePreference(mergeO: number, mergeT: number): number {
  if (mergeO === 0 || mergeT === 0) return -0.25
  if (mergeO === 1 && mergeT === 1) return 0.05
  if (mergeO > 1 && mergeT === 1) return 0.02 * (mergeO - 1)
  if (mergeO === 1 && mergeT > 1) return -0.04 * (mergeT - 1)
  return -0.1 * Math.max(mergeO - 1, mergeT - 1)
}

type AlignCell = {
  score: number
  prevI: number
  prevJ: number
  mergeO: number
  mergeT: number
}

const EMPTY_CELL: AlignCell = {
  score: -Infinity,
  prevI: 0,
  prevJ: 0,
  mergeO: 0,
  mergeT: 0,
}

/**
 * 原文/译文断句数量不一致时，合并相邻句子再配对。
 * 策略：优先 1:1，其次合并原文；允许单侧孤儿，避免句数差过大时无法对齐。
 */
export function alignSentencePairs(originals: string[], translations: string[]): SentencePair[] {
  const n = originals.length
  const m = translations.length

  if (n === 0 && m === 0) return []
  if (n === 0) return translations.map(t => ({ o: '', t }))
  if (m === 0) return originals.map(o => ({ o, t: '' }))
  if (n === m) return pairSentences(originals, translations)

  const dp: AlignCell[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: m + 1 }, () => ({ ...EMPTY_CELL }))
  )
  dp[0][0] = { score: 0, prevI: 0, prevJ: 0, mergeO: 0, mergeT: 0 }

  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      if (i === 0 && j === 0) continue

      let best: AlignCell = { ...EMPTY_CELL }

      for (let mergeO = 0; mergeO <= Math.min(MAX_ALIGN_MERGE, i); mergeO++) {
        for (let mergeT = 0; mergeT <= Math.min(MAX_ALIGN_MERGE, j); mergeT++) {
          if (mergeO === 0 && mergeT === 0) continue

          const prevI = i - mergeO
          const prevJ = j - mergeT
          const prev = dp[prevI][prevJ]
          if (prev.score === -Infinity) continue

          const o = originals.slice(prevI, i).join('')
          const t = translations.slice(prevJ, j).join('')
          const score = prev.score + scoreSentenceMatch(o, t) + mergePreference(mergeO, mergeT)

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
    if (cell.mergeO === 0 && cell.mergeT === 0) {
      // 不可达时兜底：把剩余句子按序配对，避免丢句
      pairs.unshift(...pairSentences(originals.slice(0, i), translations.slice(0, j)))
      break
    }

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
  return raw.startsWith(TRANSLATION_PREFIX)
    ? raw.slice(TRANSLATION_PREFIX.length).trim()
    : raw.trim()
}

/** 拆分「第XX回 标题正文」，便于原文/译文回目前缀对齐 */
export function splitChapterHeading(title: string): { prefix: string; body: string } {
  const match = title.match(/^(第\S+)\s+(.*)$/)
  if (!match?.[2]) return { prefix: '', body: title }
  return { prefix: match[1], body: match[2] }
}

function isChapterTitleCandidate(text: string): boolean {
  return CHAPTER_TITLE_RE.test(text)
}

function createChapter(id: number, title: string): BookChapter {
  return {
    id,
    title,
    translationTitle: '',
    pairs: [],
  }
}

function tryAssignTranslationTitle(chapter: BookChapter, text: string): boolean {
  if (chapter.translationTitle || chapter.pairs.length > 0) return false
  if (!text || !isChapterTitleCandidate(text)) return false
  chapter.translationTitle = text
  return true
}

function appendAlignedParagraph(chapter: BookChapter, original: string, translation: string): void {
  chapter.pairs.push(
    ...alignSentencePairs(
      mergeContinuationSentences(splitChineseSentences(original)),
      splitChineseSentences(translation)
    )
  )
}

export function parseBilingualPlainText(content: string): BookChapter[] {
  const lines = content.split(/\r?\n/)
  const chapters: BookChapter[] = []
  let current: BookChapter | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    if (CHAPTER_START_RE.test(line)) {
      if (current) chapters.push(current)
      current = createChapter(chapters.length + 1, line)
      continue
    }

    if (!current) continue

    if (line.startsWith(TRANSLATION_PREFIX)) {
      const translationOnly = stripTranslationPrefix(line)
      if (tryAssignTranslationTitle(current, translationOnly)) continue
      if (translationOnly) current.pairs.push({ o: '', t: translationOnly })
      continue
    }

    const nextLine = (lines[i + 1] ?? '').trim()
    if (nextLine.startsWith(TRANSLATION_PREFIX)) {
      const translation = stripTranslationPrefix(nextLine)
      if (!tryAssignTranslationTitle(current, translation)) {
        appendAlignedParagraph(current, line, translation)
      }
      i++
      continue
    }

    for (const sentence of splitChineseSentences(line)) {
      current.pairs.push({ o: sentence, t: '' })
    }
  }

  if (current) chapters.push(current)
  return chapters
}

/** @deprecated 使用 parseBilingualPlainText */
export const parseHongloumengText = parseBilingualPlainText
