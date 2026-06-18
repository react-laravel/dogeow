#!/usr/bin/env node
/**
 * 将红楼梦对照 txt 预处理为按章 JSON，原文与译文按句配对。
 *
 * 用法:
 *   npm run preprocess:hongloumeng
 *   npm run publish:hongloumeng   # 预处理并上传到又拍云（需 dogeow-api .env 配置 UPYUN_*）
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SOURCE = path.join(ROOT, '../红楼梦/红楼梦对照.txt')
const OUT_DIR = path.join(ROOT, 'public/books/hongloumeng')
const CHAPTERS_DIR = path.join(OUT_DIR, 'chapters')

const SENTENCE_ENDINGS = new Set(['。', '！', '？', '；'])

/** @param {string} text */
export function splitChineseSentences(text) {
  const normalized = text.replace(/^[　\s]+/, '').trim()
  if (!normalized) return []

  const sentences = []
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

/**
 * @param {string[]} originals
 * @param {string[]} translations
 * @returns {{ o: string, t: string }[]}
 */
export function pairSentences(originals, translations) {
  const max = Math.max(originals.length, translations.length, 0)
  const pairs = []
  for (let i = 0; i < max; i++) {
    const o = originals[i] ?? ''
    const t = translations[i] ?? ''
    if (o || t) pairs.push({ o, t })
  }
  return pairs
}

/** @param {string} raw */
function stripTranslationPrefix(raw) {
  return raw.replace(/^【译文】/, '').trim()
}

/** @param {string} content */
export function parseHongloumengText(content) {
  const lines = content.split(/\r?\n/)
  /** @type {{ id: number, title: string, translationTitle: string, pairs: { o: string, t: string }[] }[]} */
  const chapters = []
  let current = null

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
        const pairs = pairSentences(
          splitChineseSentences(original),
          splitChineseSentences(translation)
        )
        current.pairs.push(...pairs)
      }
      i++
      continue
    }

    const singles = splitChineseSentences(original)
    for (const o of singles) {
      current.pairs.push({ o, t: '' })
    }
  }

  if (current) chapters.push(current)
  return chapters
}

function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`源文件不存在: ${SOURCE}`)
    process.exit(1)
  }

  fs.mkdirSync(CHAPTERS_DIR, { recursive: true })

  const content = fs.readFileSync(SOURCE, 'utf8')
  const chapters = parseHongloumengText(content)

  const index = {
    title: '红楼梦对照',
    chapterCount: chapters.length,
    pairCount: chapters.reduce((sum, ch) => sum + ch.pairs.length, 0),
    chapters: chapters.map(ch => ({
      id: ch.id,
      title: ch.title,
      translationTitle: ch.translationTitle,
      pairCount: ch.pairs.length,
      file: `chapters/${String(ch.id).padStart(3, '0')}.json`,
    })),
  }

  for (const chapter of chapters) {
    const filePath = path.join(CHAPTERS_DIR, `${String(chapter.id).padStart(3, '0')}.json`)
    fs.writeFileSync(filePath, JSON.stringify(chapter), 'utf8')
  }

  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2), 'utf8')

  console.log(
    `已生成 ${chapters.length} 章、共 ${index.pairCount} 句对照 → ${OUT_DIR}`
  )
}

main()
