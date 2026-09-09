#!/usr/bin/env node
/**
 * 将 GitHub 上的《安娜·卡列尼娜》中文全文拆成按部/章的 TXT。
 *
 * 源：https://github.com/dooshu/shu/blob/main/yi/95.txt（草婴译）
 * 本地默认 ../../Books/安娜·卡列尼娜.txt
 *
 * 用法:
 *   npm run preprocess:annakarenina
 *   npm run publish:annakarenina
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SOURCE = path.join(ROOT, '../../Books/安娜·卡列尼娜.txt')
const OUT_DIR = path.join(ROOT, 'public/books/annakarenina')
export const SOURCE_URL = 'https://raw.githubusercontent.com/dooshu/shu/main/yi/95.txt'

export const PART_TITLES_ZH = [
  '第一部',
  '第二部',
  '第三部',
  '第四部',
  '第五部',
  '第六部',
  '第七部',
  '第八部',
]
export const EXPECTED_CHAPTER_COUNTS = [34, 35, 32, 23, 33, 32, 31, 19]

const PART_SET = new Set(PART_TITLES_ZH)
const CHAPTER_NUMBERS = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  十一: 11,
  十二: 12,
  十三: 13,
  十四: 14,
  十五: 15,
  十六: 16,
  十七: 17,
  十八: 18,
  十九: 19,
  二十: 20,
  二十一: 21,
  二十二: 22,
  二十三: 23,
  二十四: 24,
  二十五: 25,
  二十六: 26,
  二十七: 27,
  二十八: 28,
  二十九: 29,
  三十: 30,
  三十一: 31,
  三十二: 32,
  三十三: 33,
  三十四: 34,
  三十五: 35,
}

const JUNK_RE = /xiaoshuotxt|doosho\.com|dooshu|www\s*\.|Ｗ+|txt\s*小说|小说天堂|>txt|--------/i

export function isJunkLine(line) {
  const trimmed = line.trim()
  if (!trimmed) return false
  return JUNK_RE.test(trimmed)
}

export function findBodyStart(lines) {
  const opening = lines.findIndex(line => line.includes('幸福的家庭家家相似'))
  if (opening < 0) return -1
  for (let i = opening; i >= 0; i--) {
    if (lines[i].trim() === '第一部') return i
  }
  return opening
}

export function findEpigraph(lines, bodyStart) {
  for (let i = bodyStart - 1; i >= 0; i--) {
    const trimmed = lines[i].trim()
    if (!trimmed) continue
    if (trimmed.includes('伸冤在我，我必报应')) {
      return '伸冤在我，我必报应。'
    }
    break
  }
  return ''
}

/**
 * @param {string[]} lines
 * @returns {{ title: string, chapters: { number: number, title: string, lines: string[] }[] }[]}
 */
export function parseChineseParts(lines) {
  const start = findBodyStart(lines)
  if (start < 0) {
    throw new Error('找不到正文开篇（幸福的家庭家家相似）')
  }

  /** @type {{ title: string, chapters: { number: number, title: string, lines: string[] }[] }[]} */
  const parts = []
  let currentPart = null
  let currentChapter = null
  let skipNotes = false

  const closeChapter = () => {
    if (!currentPart || !currentChapter) return
    currentPart.chapters.push(currentChapter)
    currentChapter = null
  }

  for (const line of lines.slice(start)) {
    const trimmed = line.trim()
    if (PART_SET.has(trimmed)) {
      closeChapter()
      skipNotes = false
      currentPart = { title: trimmed, chapters: [] }
      parts.push(currentPart)
      continue
    }

    // 每部正文后的 * * * 起是译注，丢到下一章/部之前
    if (trimmed === '* * *') {
      closeChapter()
      skipNotes = true
      continue
    }

    if (skipNotes) continue

    if (currentPart && Object.hasOwn(CHAPTER_NUMBERS, trimmed)) {
      closeChapter()
      const number = CHAPTER_NUMBERS[trimmed]
      currentChapter = { number, title: `第${number}章`, lines: [] }
      continue
    }

    if (currentChapter && !isJunkLine(line)) {
      currentChapter.lines.push(line)
    }
  }
  closeChapter()

  const epigraph = findEpigraph(lines, start)
  if (epigraph && parts[0]?.chapters[0]) {
    parts[0].chapters[0].lines = [epigraph, '', ...parts[0].chapters[0].lines]
  }

  return parts.filter(part => part.chapters.length > 0)
}

export function unwrapChineseParagraphs(lines) {
  const paragraphs = []
  /** @type {string[]} */
  let buffer = []

  const flush = () => {
    if (buffer.length === 0) return
    const paragraph = buffer
      .join('')
      .replace(/[ \t]+/g, ' ')
      .trim()
    if (paragraph) paragraphs.push(paragraph)
    buffer = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '* * *') break
    if (!trimmed) {
      flush()
      continue
    }
    if (isJunkLine(trimmed)) continue
    buffer.push(trimmed)
  }
  flush()

  const cut = paragraphs.findIndex(paragraph => paragraph === '一八七三年至一八七七年')
  return (cut >= 0 ? paragraphs.slice(0, cut) : paragraphs).join('\n\n')
}

export function assertExpectedStructure(parts) {
  if (parts.length !== PART_TITLES_ZH.length) {
    throw new Error(`部数不符：得到 ${parts.length}，期望 ${PART_TITLES_ZH.length}`)
  }

  parts.forEach((part, index) => {
    if (part.title !== PART_TITLES_ZH[index]) {
      throw new Error(
        `第 ${index + 1} 部标题不符：得到 ${part.title}，期望 ${PART_TITLES_ZH[index]}`
      )
    }
    const expected = EXPECTED_CHAPTER_COUNTS[index]
    if (part.chapters.length !== expected) {
      throw new Error(`${part.title} 章数不符：得到 ${part.chapters.length}，期望 ${expected}`)
    }
    part.chapters.forEach((chapter, chapterIndex) => {
      if (chapter.number !== chapterIndex + 1) {
        throw new Error(
          `${part.title} 章节编号不连续：第 ${chapterIndex + 1} 篇是第 ${chapter.number} 章`
        )
      }
    })
  })
}

export function buildIndex(parts) {
  return {
    title: '安娜·卡列尼娜',
    author: '列夫·托尔斯泰',
    translator: '草婴',
    totalVolumes: parts.length,
    totalChapters: parts.reduce((sum, part) => sum + part.chapters.length, 0),
    volumes: parts.map((part, partIndex) => ({
      name: part.title,
      chapters: part.chapters.map(chapter => ({
        name: chapter.title,
        file: `part-${String(partIndex + 1).padStart(2, '0')}/chapter-${String(chapter.number).padStart(2, '0')}.txt`,
      })),
    })),
  }
}

export function writeBookFiles(parts, outDir) {
  fs.rmSync(outDir, { recursive: true, force: true })
  fs.mkdirSync(outDir, { recursive: true })

  const index = buildIndex(parts)
  for (const [partIndex, part] of parts.entries()) {
    const partDir = path.join(outDir, `part-${String(partIndex + 1).padStart(2, '0')}`)
    fs.mkdirSync(partDir, { recursive: true })
    for (const chapter of part.chapters) {
      const fileName = `chapter-${String(chapter.number).padStart(2, '0')}.txt`
      const body = unwrapChineseParagraphs(chapter.lines)
      if (!body) {
        throw new Error(`${part.title} ${chapter.title} 正文为空`)
      }
      fs.writeFileSync(path.join(partDir, fileName), body + '\n', 'utf8')
    }
  }

  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2) + '\n', 'utf8')
  return index
}

async function ensureSource() {
  if (fs.existsSync(SOURCE) && fs.statSync(SOURCE).size > 1000) {
    return SOURCE
  }

  fs.mkdirSync(path.dirname(SOURCE), { recursive: true })
  console.log(`源文件不存在，正在下载：${SOURCE_URL}`)
  const response = await fetch(SOURCE_URL)
  if (!response.ok) {
    throw new Error(`下载失败：HTTP ${response.status}`)
  }
  const text = await response.text()
  fs.writeFileSync(SOURCE, text, 'utf8')
  return SOURCE
}

async function main() {
  const source = await ensureSource()
  const lines = fs
    .readFileSync(source, 'utf8')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
  const parts = parseChineseParts(lines)
  assertExpectedStructure(parts)
  const index = writeBookFiles(parts, OUT_DIR)
  console.log(
    `已生成《${index.title}》（${index.translator}译）${index.totalVolumes} 部、${index.totalChapters} 章 → ${OUT_DIR}`
  )
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
