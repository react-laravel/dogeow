import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  assertExpectedStructure,
  buildIndex,
  findBodyStart,
  findEpigraph,
  isJunkLine,
  parseChineseParts,
  unwrapChineseParagraphs,
  writeBookFiles,
} from '../preprocess-annakarenina.mjs'

const SAMPLE = `安娜卡列尼娜 - 草婴译
　第一部
　　一
　　二
伸冤在我，我必报应。

第一部

一

幸福的家庭家家相似，不幸的家庭各各不同。

奥勃朗斯基家里一片混乱。
www.xiaoshuotxt.com

二

那年冬末，谢尔巴茨基家请医生会诊。

* * *

德国西部一个城市。

原文为意大利语。

第二部

一

吉娣的病由于节令将近入春，更加恶化。
`

describe('preprocess-annakarenina', () => {
  const tempDirs = []

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true })
    }
    tempDirs.length = 0
  })

  it('skips the table of contents and starts at the novel opening', () => {
    const lines = SAMPLE.split('\n')
    const start = findBodyStart(lines)
    expect(start).toBeGreaterThan(4)
    expect(findEpigraph(lines, start)).toBe('伸冤在我，我必报应。')
    expect(isJunkLine('www.xiaoshuotxt.com')).toBe(true)
  })

  it('splits eight-part chinese chapter markers', () => {
    const parts = parseChineseParts(SAMPLE.split('\n'))
    expect(parts.map(part => part.title)).toEqual(['第一部', '第二部'])
    expect(parts[0]?.chapters.map(chapter => chapter.number)).toEqual([1, 2])
    expect(unwrapChineseParagraphs(parts[0].chapters[0].lines)).toContain('伸冤在我，我必报应。')
    expect(unwrapChineseParagraphs(parts[0].chapters[0].lines)).toContain('幸福的家庭家家相似')
    expect(unwrapChineseParagraphs(parts[0].chapters[0].lines)).not.toContain('xiaoshuotxt')
    expect(unwrapChineseParagraphs(parts[0].chapters[1].lines)).toContain('那年冬末')
    expect(unwrapChineseParagraphs(parts[0].chapters[1].lines)).not.toContain('德国西部')
  })

  it('writes volume index and chapter files', () => {
    const outDir = mkdtempSync(path.join(os.tmpdir(), 'annakarenina-'))
    tempDirs.push(outDir)
    const parts = parseChineseParts(SAMPLE.split('\n'))
    const index = writeBookFiles(parts, outDir)

    expect(index.translator).toBe('草婴')
    expect(index.totalChapters).toBe(3)
    expect(index.volumes[0]?.chapters[0]?.file).toBe('part-01/chapter-01.txt')

    const chapter = readFileSync(path.join(outDir, 'part-01/chapter-01.txt'), 'utf8')
    expect(chapter).toContain('伸冤在我，我必报应。')
    expect(chapter).toContain('幸福的家庭家家相似')
    expect(chapter).toContain('\n\n')
    const lastOfPart1 = readFileSync(path.join(outDir, 'part-01/chapter-02.txt'), 'utf8')
    expect(lastOfPart1).not.toContain('德国西部')
  })

  it('rejects the wrong part/chapter counts', () => {
    const parts = parseChineseParts(SAMPLE.split('\n'))
    expect(() => assertExpectedStructure(parts)).toThrow(/部数不符/)
    expect(buildIndex(parts).title).toBe('安娜·卡列尼娜')
  })
})
