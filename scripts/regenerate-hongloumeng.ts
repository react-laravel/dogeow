/**
 * 重新生成红楼梦对照 JSON 文件（使用修复后的 alignSentencePairs 算法）
 *
 * 用法: npx tsx scripts/regenerate-hongloumeng.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { parseHongloumengText } from '../app/book/hongloumeng/utils/parseBook'

const SOURCE_FILE = '/Users/sam/Code/DogeOW/红楼梦/红楼梦对照.txt'
const OUTPUT_DIR = '/Users/sam/Code/DogeOW/dogeow/public/books/hongloumeng/chapters'

function main() {
  console.log('Reading source file...')
  const content = readFileSync(SOURCE_FILE, 'utf-8')
  console.log(`Source file size: ${(content.length / 1024 / 1024).toFixed(1)} MB`)

  console.log('Parsing chapters...')
  const chapters = parseHongloumengText(content)
  console.log(`Found ${chapters.length} chapters`)

  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true })

  // Write each chapter
  for (const chapter of chapters) {
    const filename = String(chapter.id).padStart(3, '0') + '.json'
    const filepath = `${OUTPUT_DIR}/${filename}`

    const output = {
      id: chapter.id,
      title: chapter.title,
      translationTitle: chapter.translationTitle,
      pairs: chapter.pairs,
    }

    writeFileSync(filepath, JSON.stringify(output, null, 2), 'utf-8')
  }

  console.log(`Written ${chapters.length} chapter files to ${OUTPUT_DIR}`)

  // Write updated index
  const indexOutput = {
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

  writeFileSync(`${OUTPUT_DIR}/../index.json`, JSON.stringify(indexOutput, null, 2), 'utf-8')

  console.log(
    `Index written: ${indexOutput.chapterCount} chapters, ${indexOutput.pairCount} total pairs`
  )

  // Show sample pairs from chapter 1
  console.log('\n=== Sample pairs from chapter 1 ===')
  const ch1 = chapters[0]
  for (let i = 75; i < Math.min(85, ch1.pairs.length); i++) {
    const p = ch1.pairs[i]
    console.log(`[${i}] O(${p.o.length}): ${p.o.slice(0, 50)}${p.o.length > 50 ? '...' : ''}`)
    console.log(`    T(${p.t.length}): ${p.t.slice(0, 50)}${p.t.length > 50 ? '...' : ''}`)
  }
}

main()
