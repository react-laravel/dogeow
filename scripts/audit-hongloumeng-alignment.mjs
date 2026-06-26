#!/usr/bin/env node
/**
 * Audit 红楼梦对照.txt for adjacent paragraph translation swaps.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  scoreSentenceMatch,
  splitChineseSentences,
  mergeContinuationSentences,
  alignSentencePairs,
} from '../app/book/hongloumeng/utils/parseBook.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOURCE = path.resolve(__dirname, '../../红楼梦/红楼梦对照.txt')

function blockScore(o, t) {
  if (!o || !t || t === '（无）') return null
  const os = mergeContinuationSentences(splitChineseSentences(o))
  const ts = splitChineseSentences(t)
  const pairs = alignSentencePairs(os, ts)
  let sum = 0
  let n = 0
  for (const p of pairs) {
    if (!p.o || !p.t) continue
    sum += scoreSentenceMatch(p.o, p.t)
    n++
  }
  return n ? sum / n : 0
}

function collectBlocks(content) {
  const lines = content.split(/\r?\n/)
  /** @type {{ chapter: number, oLine: number, tLine: number, o: string, t: string }[]} */
  const blocks = []
  let chapter = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (/^第\d+章/.test(line)) {
      chapter = Number.parseInt(line.match(/^第(\d+)章/)?.[1] ?? '0', 10)
      continue
    }
    if (!line || line.startsWith('【译文】')) continue
    const next = (lines[i + 1] ?? '').trim()
    if (!next.startsWith('【译文】')) continue
    const o = line.replace(/^[　\s]+/, '')
    const t = next.replace(/^【译文】/, '').trim()
    if (!t || t === '（无）') continue
    blocks.push({ chapter, oLine: i + 1, tLine: i + 2, o, t })
  }

  return { lines, blocks }
}

function findSwapCandidates(blocks) {
  /** @type {{ chapter: number, oLineA: number, tLineA: number, oLineB: number, tLineB: number, gain: number, direct: number, swapped: number }[]} */
  const swaps = []

  for (let i = 0; i < blocks.length - 1; i++) {
    const a = blocks[i]
    const b = blocks[i + 1]
    if (a.chapter !== b.chapter) continue

    const directA = blockScore(a.o, a.t)
    const directB = blockScore(b.o, b.t)
    const crossAB = blockScore(a.o, b.t)
    const crossBA = blockScore(b.o, a.t)
    if ([directA, directB, crossAB, crossBA].some(v => v === null)) continue

    const direct = directA + directB
    const swapped = crossAB + crossBA
    const gain = swapped - direct

    if (gain > 0.12 && crossAB > directA + 0.04 && crossBA > directB + 0.04) {
      swaps.push({
        chapter: a.chapter,
        oLineA: a.oLine,
        tLineA: a.tLine,
        oLineB: b.oLine,
        tLineB: b.tLine,
        gain,
        direct,
        swapped,
      })
    }
  }

  return swaps
}

function applySwaps(content, swaps) {
  const lines = content.split(/\r?\n/)
  const usedTLines = new Set()

  for (const swap of swaps) {
    if (usedTLines.has(swap.tLineA) || usedTLines.has(swap.tLineB)) continue
    const idxA = swap.tLineA - 1
    const idxB = swap.tLineB - 1
    const lineA = lines[idxA]
    const lineB = lines[idxB]
    if (!lineA?.startsWith('【译文】') || !lineB?.startsWith('【译文】')) continue
    lines[idxA] = lineB
    lines[idxB] = lineA
    usedTLines.add(swap.tLineA)
    usedTLines.add(swap.tLineB)
  }

  return lines.join('\n')
}

const content = fs.readFileSync(SOURCE, 'utf8')
const { blocks } = collectBlocks(content)
let swaps = findSwapCandidates(blocks)

console.log(`Blocks: ${blocks.length}`)
console.log(`Swap candidates: ${swaps.length}`)
for (const s of swaps) {
  const a = blocks.find(b => b.oLine === s.oLineA)
  const b = blocks.find(b => b.oLine === s.oLineB)
  console.log(
    `Ch${s.chapter} L${s.oLineA}/L${s.oLineB} gain=${s.gain.toFixed(3)} direct=${s.direct.toFixed(3)} swapped=${s.swapped.toFixed(3)}`
  )
  console.log(`  A: ${a?.o.slice(0, 48)}`)
  console.log(`  B: ${b?.o.slice(0, 48)}`)
}

if (process.argv.includes('--apply')) {
  // Iterate until stable (chains of swaps)
  let current = content
  let round = 0
  let total = 0
  while (round < 5) {
    const { blocks: roundBlocks } = collectBlocks(current)
    const roundSwaps = findSwapCandidates(roundBlocks)
    if (roundSwaps.length === 0) break
    current = applySwaps(current, roundSwaps)
    total += roundSwaps.length
    round++
    console.log(`Round ${round}: applied ${roundSwaps.length} swaps`)
  }
  fs.writeFileSync(SOURCE, current)
  console.log(`Applied ${total} swaps total → ${SOURCE}`)
}

if (process.argv.includes('--fix-indent')) {
  const fileLines = content.split(/\r?\n/)
  let fixed = 0
  for (let i = 0; i < fileLines.length - 1; i++) {
    const line = fileLines[i]
    const trimmed = line.trim()
    const next = (fileLines[i + 1] ?? '').trim()
    if (!trimmed || trimmed.startsWith('【译文】') || /^第\d+章/.test(trimmed)) continue
    if (!next.startsWith('【译文】')) continue
    if (line.startsWith('　')) continue
    if (trimmed.length < 20) continue
    if (/^[(（]本章完[)）]$/.test(trimmed)) continue
    if (/下回分解/.test(trimmed) && trimmed.length < 30) continue
    fileLines[i] = `　　${trimmed}`
    fixed++
    console.log(`Fixed indent at line ${i + 1}: ${trimmed.slice(0, 48)}`)
  }
  fs.writeFileSync(SOURCE, fileLines.join('\n'))
  console.log(`Fixed ${fixed} paragraph indents → ${SOURCE}`)
}
