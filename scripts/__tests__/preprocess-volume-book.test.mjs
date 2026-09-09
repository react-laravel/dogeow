import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { chineseToNumber } from '../lib/chinese-number.mjs'
import {
  assertExpectedStructure,
  findBodyStart,
  isJunkLine,
  parseVolumeBook,
  prepareLines,
  unwrapParagraphs,
  writeBookFiles,
} from '../lib/volume-book-parse.mjs'
import { VOLUME_BOOKS, VOLUME_BOOK_IDS } from '../volume-books.mjs'

describe('chineseToNumber', () => {
  it.each([
    ['一', 1],
    ['十', 10],
    ['十一', 11],
    ['二十', 20],
    ['二十一', 21],
    ['三十', 30],
    ['一百', 100],
    ['一百零八', 108],
    ['一百十八', 118],
    ['一百二十', 120],
    ['54', 54],
  ])('parses %s', (input, expected) => {
    expect(chineseToNumber(input)).toBe(expected)
  })
})

describe('volume book parser', () => {
  const tempDirs = []

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true })
    }
    tempDirs.length = 0
  })

  it('lists the ten gaokao volume books', () => {
    expect(VOLUME_BOOK_IDS).toEqual([
      'biancheng',
      'sishitongtang',
      'hongyan',
      'pingfandeshijie',
      'leiyu',
      'balishengmuyuan',
      'laorenyuhai',
      'ouyenigelangtai',
      'lunyu',
      'sanguoyanyi',
    ])
  })

  it('skips watermarks and xml wrappers', () => {
    expect(isJunkLine('www.xiaoshuotxt.com')).toBe(true)
    expect(isJunkLine('ÁÁÁÁÁÁÁÁÁÁ：doosho.com')).toBe(true)
    expect(isJunkLine('【新语丝电子文库(www.xys.org)】')).toBe(true)
    expect(isJunkLine('输入：Amy Han')).toBe(true)
    expect(isJunkLine('——牛文 作')).toBe(true)
    const lines = prepareLines('<book>论语</book>\n学而第一\n子曰：“学而时习之。”\n', {
      stripXml: true,
    })
    expect(lines.some(line => line.includes('学而第一'))).toBe(true)
    expect(lines.some(line => line.includes('<book>'))).toBe(false)
  })

  it('starts 红岩 after the table of contents', () => {
    const spec = VOLUME_BOOKS.hongyan
    const lines = [
      '红岩 - 罗广斌、杨益言',
      '第一章',
      '第二章',
      'doosho.com',
      '第一章',
      '抗战胜利纪功碑，隐没在灰蒙蒙的雾海里。',
    ]
    expect(findBodyStart(lines, spec)).toBe(4)
    const parts = parseVolumeBook(lines, spec)
    expect(parts[0]?.chapters).toHaveLength(1)
    expect(unwrapParagraphs(parts[0].chapters[0].lines)).toContain('抗战胜利纪功碑')
  })

  it('splits 边城 sequential chapter numbers', () => {
    const spec = VOLUME_BOOKS.biancheng
    const lines = ['第一章 一', '茶峒。', '第八章 二十一', '白塔。']
    const parts = parseVolumeBook(lines, spec)
    expect(parts[0]?.chapters.map(chapter => chapter.title)).toEqual(['第1章', '第21章'])
  })

  it('groups 四世同堂 into three volumes by segment number', () => {
    const spec = VOLUME_BOOKS.sishitongtang
    const lines = ['四世同堂序幕', '说明', '四世同堂01', '祁老太爷。', '四世同堂35', '偷生。']
    const parts = parseVolumeBook(lines, spec)
    expect(parts.map(part => part.title)).toEqual(['惶惑', '偷生'])
    expect(parts[0].chapters[0].title).toBe('第01段')
  })

  it('opens a new volume on 平凡的世界 combo headings', () => {
    const spec = VOLUME_BOOKS.pingfandeshijie
    const lines = ['第一部 第一章', '雨。', '第二章', '孙少平。', '第二部 第一章', '田福堂。']
    const parts = parseVolumeBook(lines, spec)
    expect(parts.map(part => part.title)).toEqual(['第一部', '第二部'])
    expect(parts[0].chapters.map(chapter => chapter.title)).toEqual(['第一章', '第二章'])
  })

  it('treats a bare 第三十七 as 第三十七章', () => {
    const spec = VOLUME_BOOKS.pingfandeshijie
    const lines = [
      '第一部 第一章',
      '雨。',
      '第三十六章',
      '田润叶。',
      '第三十七',
      '孙少平在高中的最后一个学期开始了。',
      '第三十八章',
      '兰香。',
    ]
    const parts = parseVolumeBook(lines, spec)
    expect(parts[0].chapters.map(chapter => chapter.title)).toEqual([
      '第一章',
      '第三十六章',
      '第三十七章',
      '第三十八章',
    ])
    expect(unwrapParagraphs(parts[0].chapters[2].lines)).toContain('孙少平在高中')
  })

  it('keeps 雷雨 speeches as separate paragraphs', () => {
    const lines = [
      '姑奶奶甲（教堂尼姑）',
      '姑奶奶乙',
      '周朴园－－某煤矿公司董事长，五十五岁。',
      '姑甲    （和蔼地）请进来吧。',
      '老人    （点头）嗯。',
      '                〔一位苍白的老年人走进来，穿着很考究的旧皮大衣，进门脱下帽子，头',
      '       发斑白。',
    ]
    const text = unwrapParagraphs(lines, 'play')
    expect(text).toContain('姑奶奶甲（教堂尼姑）')
    expect(text).toContain('周朴园－－某煤矿公司董事长，五十五岁。')
    expect(text).toContain('姑甲 （和蔼地）请进来吧。')
    expect(text).toContain('老人 （点头）嗯。')
    expect(text).toContain('一位苍白的老年人走进来')
    expect(text).toContain('帽子，头发斑白')
    expect(text).not.toContain('姑奶奶甲（教堂尼姑）姑奶奶乙')
    expect(text.split('\n\n').length).toBeGreaterThanOrEqual(5)
  })

  it('rejoins hard-wrapped 三国 opening verse', () => {
    const text = unwrapParagraphs(
      [
        '滚滚长江东逝水，浪花淘尽英雄。是非成败转头空。',
        '',
        '青山依旧在，几度夕阳红。白发渔樵江渚上，惯',
        '',
        '看秋月春风。一壶浊酒喜相逢。古今多少事，都付',
        '',
        '笑谈中。',
        '',
        '——调寄《临江仙》',
        '',
        '话说天下大势，分久必合，合久必分。',
      ],
      'hardwrap'
    )
    expect(text).toContain('惯看秋月春风')
    expect(text).toContain('都付笑谈中。')
    expect(text).not.toContain('临江仙》话说')
    expect(text.split('\n\n')).toHaveLength(4)
  })

  it('starts a new volume on a bare 第N卷 heading', () => {
    const spec = VOLUME_BOOKS.balishengmuyuan
    const lines = [
      '第一卷',
      '第一章 大厅',
      '钟声齐鸣。',
      '第二章 彼埃尔·格兰古瓦',
      '诗人上场。',
      '第二卷',
      '第一章 从夏里德到席拉',
      '夜色。',
    ]
    const parts = parseVolumeBook(lines, spec)
    expect(parts.map(part => part.title)).toEqual(['第一卷', '第二卷'])
    expect(parts[0].chapters.map(chapter => chapter.title)).toEqual([
      '第一章 大厅',
      '第二章 彼埃尔·格兰古瓦',
    ])
    expect(parts[1].chapters[0].title).toBe('第一章 从夏里德到席拉')
  })

  it('writes volume index and chapter files', () => {
    const outDir = mkdtempSync(path.join(os.tmpdir(), 'volume-book-'))
    tempDirs.push(outDir)
    const spec = {
      ...VOLUME_BOOKS.lunyu,
      expectedChapterCounts: [1],
    }
    const parts = parseVolumeBook(['学而第一', '子曰：“学而时习之。”'], spec)
    assertExpectedStructure(parts, spec)
    const index = writeBookFiles(spec, parts, outDir)
    expect(index.totalChapters).toBe(1)
    expect(readFileSync(path.join(outDir, 'part-01/chapter-01.txt'), 'utf8')).toContain(
      '学而时习之'
    )
  })
})
