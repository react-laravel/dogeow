import fs from 'node:fs'
import path from 'node:path'

const JUNK_RE =
  /xiaoshuotxt|doosho\.com|dooshu|www\s*\.|Ｗ+|txt\s*小说|小说天堂|>txt|--------|新语丝|xys\.org|录入：|输入：|Anna’s Archive|Anna's Archive/i

/**
 * @param {string} line
 */
export function isJunkLine(line) {
  const trimmed = line.trim()
  if (!trimmed) return false
  if (JUNK_RE.test(trimmed)) return true
  if (/^[—\-–═★\s]+$/.test(trimmed)) return true
  if (trimmed === '四幕悲剧' || trimmed === '曹禺') return true
  if (/^——\s*\S+\s*作$/.test(trimmed)) return true
  return false
}

/**
 * @param {string[]} lines
 * @param {{ bodyContains?: string, walkBackTo?: RegExp, skipUntil?: RegExp }} spec
 */
export function findBodyStart(lines, spec) {
  if (spec.bodyContains) {
    const opening = lines.findIndex(line => line.includes(spec.bodyContains))
    if (opening < 0) return -1
    if (spec.walkBackTo) {
      for (let i = opening; i >= 0; i--) {
        if (spec.walkBackTo.test(lines[i].trim())) return i
      }
    }
    return opening
  }

  if (spec.skipUntil) {
    return lines.findIndex(line => spec.skipUntil.test(line.trim()))
  }

  return 0
}

/**
 * @param {string} raw
 * @param {{ stripXml?: boolean }} spec
 */
export function prepareLines(raw, spec) {
  let text = raw.replace(/^\uFEFF/, '')
  if (spec.stripXml) {
    text = text.replace(/<\/?[^>]+>/g, '\n')
  }
  return text.split(/\r?\n/)
}

function isPlayBreak(trimmed) {
  if (trimmed.startsWith('〔') || trimmed.startsWith('[') || trimmed.startsWith('［')) {
    return true
  }
  return /^\S{1,8}\s{2,}/.test(trimmed)
}

/**
 * @param {string[]} lines
 * @param {'paragraph' | 'play'} [mode]
 */
function flushJoined(buffer, paragraphs) {
  if (buffer.length === 0) return
  const paragraph = buffer.join('').replace(/[ \t]+/g, ' ').trim()
  if (paragraph) paragraphs.push(paragraph)
  buffer.length = 0
}

export function unwrapParagraphs(lines, mode = 'paragraph') {
  if (mode === 'play') {
    const paragraphs = []
    /** @type {string[]} */
    const buffer = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        flushJoined(buffer, paragraphs)
        continue
      }
      if (isJunkLine(trimmed) || trimmed === '完') continue
      const previous = buffer[buffer.length - 1]
      if (buffer.length > 0 && (isPlayBreak(trimmed) || (previous && previous.length < 40))) {
        flushJoined(buffer, paragraphs)
      }
      buffer.push(trimmed)
    }
    flushJoined(buffer, paragraphs)
    return paragraphs.join('\n\n')
  }

  if (mode === 'hardwrap') {
    const paragraphs = []
    /** @type {string[]} */
    const buffer = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        flushJoined(buffer, paragraphs)
        continue
      }
      if (isJunkLine(trimmed) || trimmed === '完') continue
      buffer.push(trimmed)
    }
    flushJoined(buffer, paragraphs)
    return paragraphs.join('\n\n')
  }

  const paragraphs = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || isJunkLine(trimmed) || trimmed === '完') continue
    paragraphs.push(trimmed)
  }
  return paragraphs.join('\n\n')
}

function volumeForChapterNumber(spec, number) {
  const ranges = spec.volumeByChapterNumber
  if (!ranges || number == null) return null
  return ranges.find(range => number >= range.start && number <= range.end) ?? null
}

/**
 * @param {string[]} lines
 * @param {object} spec
 */
export function parseVolumeBook(lines, spec) {
  const start = findBodyStart(lines, spec)
  if (start < 0) {
    throw new Error(`找不到《${spec.title}》正文起点`)
  }

  /** @type {{ title: string, chapters: { number: number, title: string, lines: string[] }[] }[]} */
  const parts = []
  let currentPart = null
  let currentChapter = null

  const closeChapter = () => {
    if (!currentPart || !currentChapter) return
    currentPart.chapters.push(currentChapter)
    currentChapter = null
  }

  const ensureVolume = title => {
    if (currentPart?.title === title) return
    closeChapter()
    currentPart = { title, chapters: [] }
    parts.push(currentPart)
  }

  for (const line of lines.slice(start)) {
    const trimmed = line.trim()
    if (spec.stopAt?.test(trimmed)) break

    const classified = spec.classify(trimmed)
    if (classified) {
      if (spec.skipTitles?.includes(classified.title)) continue

      if (classified.type === 'volume') {
        ensureVolume(classified.volumeName || classified.title)
        continue
      }

      if (classified.volumeName) {
        ensureVolume(classified.volumeName)
      }

      const ranged = volumeForChapterNumber(spec, classified.number)
      if (ranged) ensureVolume(ranged.name)

      if (!currentPart) {
        ensureVolume(spec.defaultVolumeName)
      }

      closeChapter()
      currentChapter = {
        number: classified.number ?? currentPart.chapters.length + 1,
        title: classified.title,
        lines: [],
      }
      continue
    }

    if (currentChapter && !isJunkLine(line)) {
      currentChapter.lines.push(line)
    }
  }

  closeChapter()
  return parts.filter(part => part.chapters.length > 0)
}

/**
 * @param {{ title: string, chapters: unknown[] }[]} parts
 * @param {object} spec
 */
export function assertExpectedStructure(parts, spec) {
  const expected = spec.expectedChapterCounts
  if (parts.length !== expected.length) {
    throw new Error(
      `《${spec.title}》部/卷数不符：得到 ${parts.length}，期望 ${expected.length}`
    )
  }

  parts.forEach((part, index) => {
    const count = expected[index]
    if (part.chapters.length !== count) {
      throw new Error(
        `《${spec.title}》${part.title} 章数不符：得到 ${part.chapters.length}，期望 ${count}`
      )
    }
  })
}

/**
 * @param {object} spec
 * @param {{ title: string, chapters: { title: string }[] }[]} parts
 */
function chapterPadWidth(count) {
  return Math.max(2, String(count).length)
}

export function buildIndex(spec, parts) {
  return {
    title: spec.title,
    author: spec.author,
    ...(spec.translator ? { translator: spec.translator } : {}),
    totalVolumes: parts.length,
    totalChapters: parts.reduce((sum, part) => sum + part.chapters.length, 0),
    volumes: parts.map((part, partIndex) => {
      const width = chapterPadWidth(part.chapters.length)
      return {
        name: part.title,
        chapters: part.chapters.map((chapter, chapterIndex) => ({
          name: chapter.title,
          file: `part-${String(partIndex + 1).padStart(2, '0')}/chapter-${String(chapterIndex + 1).padStart(width, '0')}.txt`,
        })),
      }
    }),
  }
}

/**
 * @param {object} spec
 * @param {{ title: string, chapters: { title: string, lines: string[] }[] }[]} parts
 * @param {string} outDir
 */
export function writeBookFiles(spec, parts, outDir) {
  fs.rmSync(outDir, { recursive: true, force: true })
  fs.mkdirSync(outDir, { recursive: true })

  const index = buildIndex(spec, parts)
  const unwrapMode = spec.unwrap ?? 'paragraph'

  for (const [partIndex, part] of parts.entries()) {
    const partDir = path.join(outDir, `part-${String(partIndex + 1).padStart(2, '0')}`)
    fs.mkdirSync(partDir, { recursive: true })
    const width = chapterPadWidth(part.chapters.length)
    for (const [chapterIndex, chapter] of part.chapters.entries()) {
      const fileName = `chapter-${String(chapterIndex + 1).padStart(width, '0')}.txt`
      const body = unwrapParagraphs(chapter.lines, unwrapMode)
      if (!body) {
        throw new Error(`《${spec.title}》${part.title} ${chapter.title} 正文为空`)
      }
      fs.writeFileSync(path.join(partDir, fileName), body + '\n', 'utf8')
    }
  }

  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2) + '\n', 'utf8')
  return index
}
