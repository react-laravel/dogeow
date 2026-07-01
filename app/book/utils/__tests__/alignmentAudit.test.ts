import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { scoreSentenceMatch } from '../bilingualParse'

function loadChapter(id: number) {
  const file = path.join(
    process.cwd(),
    'public/books/hongloumeng/chapters',
    `${String(id).padStart(3, '0')}.json`
  )
  return JSON.parse(readFileSync(file, 'utf8')) as {
    pairs: { o: string; t: string }[]
  }
}

function findPair(chapterId: number, needle: string) {
  const chapter = loadChapter(chapterId)
  const pair = chapter.pairs.find(p => p.o.includes(needle))
  expect(pair, `missing pair containing "${needle}" in chapter ${chapterId}`).toBeDefined()
  return pair!
}

describe('hongloumeng alignment audit', () => {
  it('chapter 4 雨村发怒段落应与译文逐句对应', () => {
    const pair = findPair(4, '雨村听了，大怒道')
    expect(pair.t).toContain('哪有这种事')
    expect(scoreSentenceMatch(pair.o, pair.t)).toBeGreaterThan(0.2)
  })

  it('chapter 4 薛蟠介绍段落不应再错配选秀译文', () => {
    const pair = findPair(4, '当下言不着雨村')
    expect(pair.t).toContain('不再提雨村')
    expect(pair.t).not.toContain('选秀')
  })

  it('chapter 3 黛玉安置与袭人段落译文不再互换', () => {
    const housing = findPair(3, '当下奶娘来问黛玉房舍')
    expect(housing.t).toMatch(/奶娘|碧纱厨|袭人/)
    const xiren = findPair(3, '却说袭人倒有些痴处')
    expect(xiren.t).toMatch(/袭人|痴/)
  })
})
