#!/usr/bin/env node
/**
 * 将本地中文全书拆成按卷/章的 TXT，供 VolumeBookReader 使用。
 *
 * 用法:
 *   node scripts/preprocess-volume-book.mjs biancheng
 *   node scripts/preprocess-volume-book.mjs --all
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { VOLUME_BOOKS, VOLUME_BOOK_IDS } from './volume-books.mjs'
import {
  assertExpectedStructure,
  parseVolumeBook,
  prepareLines,
  writeBookFiles,
} from './lib/volume-book-parse.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BOOKS_DIR = path.join(ROOT, '../../Books')

export async function ensureSource(spec) {
  const source = path.join(BOOKS_DIR, spec.sourceFile)
  if (fs.existsSync(source) && fs.statSync(source).size > 1000) {
    return source
  }

  if (!spec.sourceUrl) {
    throw new Error(`源文件不存在：${source}`)
  }

  fs.mkdirSync(path.dirname(source), { recursive: true })
  console.log(`源文件不存在，正在下载：${spec.sourceUrl}`)
  const response = await fetch(spec.sourceUrl)
  if (!response.ok) {
    throw new Error(`下载失败：HTTP ${response.status}`)
  }
  const text = await response.text()
  fs.writeFileSync(source, text, 'utf8')
  return source
}

export async function preprocessBook(id) {
  const spec = VOLUME_BOOKS[id]
  if (!spec) {
    throw new Error(`未知书目：${id}。可选：${VOLUME_BOOK_IDS.join(', ')}`)
  }

  const source = await ensureSource(spec)
  const raw = fs.readFileSync(source, 'utf8')
  const lines = prepareLines(raw, spec)
  const parts = parseVolumeBook(lines, spec)
  assertExpectedStructure(parts, spec)
  const outDir = path.join(ROOT, 'public/books', spec.id)
  const index = writeBookFiles(spec, parts, outDir)
  return { spec, index, outDir }
}

async function main() {
  const args = process.argv.slice(2)
  const ids = args.includes('--all')
    ? VOLUME_BOOK_IDS
    : args.filter(arg => arg && !arg.startsWith('-'))

  if (ids.length === 0) {
    console.error(
      `用法: node scripts/preprocess-volume-book.mjs <id>|--all\n可选 id: ${VOLUME_BOOK_IDS.join(', ')}`
    )
    process.exit(1)
  }

  for (const id of ids) {
    const { index, outDir } = await preprocessBook(id)
    const translator = index.translator ? `，${index.translator}译` : ''
    console.log(
      `已生成《${index.title}》${translator} ${index.totalVolumes} 卷、${index.totalChapters} 章 → ${outDir}`
    )
  }
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
