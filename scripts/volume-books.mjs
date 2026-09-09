import { chineseToNumber } from './lib/chinese-number.mjs'

const CHAPTER_NUM = '一二三四五六七八九十百千零两〇'

/**
 * @param {string} title
 */
function chapterNumberFromTitle(title) {
  const match = title.match(new RegExp(`^[第]?([${CHAPTER_NUM}]+)[章回节]?$`))
  if (!match) return Number.NaN
  return chineseToNumber(match[1])
}

/** @type {Record<string, object>} */
export const VOLUME_BOOKS = {
  biancheng: {
    id: 'biancheng',
    title: '边城',
    author: '沈从文',
    sourceFile: '边城.txt',
    sourceUrl:
      'https://raw.githubusercontent.com/BlankRain/ebooks/master/边城-沈从文_TXT小说天堂.txt',
    defaultVolumeName: '边城',
    expectedChapterCounts: [21],
    classify(line) {
      const match = line.match(
        new RegExp(`^第[${CHAPTER_NUM}]+章\\s+([${CHAPTER_NUM}]+)$`)
      )
      if (!match) return null
      const number = chineseToNumber(match[1])
      return { type: 'chapter', title: `第${number}章`, number }
    },
  },

  sishitongtang: {
    id: 'sishitongtang',
    title: '四世同堂',
    author: '老舍',
    sourceFile: '四世同堂.txt',
    sourceUrl:
      'https://raw.githubusercontent.com/BlankRain/ebooks/master/四世同堂-老舍_TXT小说天堂.txt',
    defaultVolumeName: '惶惑',
    skipUntil: /^四世同堂01$/,
    volumeByChapterNumber: [
      { start: 1, end: 34, name: '惶惑' },
      { start: 35, end: 67, name: '偷生' },
      { start: 68, end: 100, name: '饥荒' },
    ],
    expectedChapterCounts: [34, 33, 33],
    classify(line) {
      const match = line.match(/^四世同堂(\d+)$/)
      if (!match) return null
      const number = Number(match[1])
      return { type: 'chapter', title: `第${String(number).padStart(2, '0')}段`, number }
    },
  },

  hongyan: {
    id: 'hongyan',
    title: '红岩',
    author: '罗广斌、杨益言',
    sourceFile: '红岩.txt',
    sourceUrl: 'https://raw.githubusercontent.com/dooshu/shu/main/cn/644.txt',
    defaultVolumeName: '红岩',
    bodyContains: '抗战胜利纪功碑',
    walkBackTo: /^第一章$/,
    expectedChapterCounts: [30],
    classify(line) {
      const match = line.match(new RegExp(`^第([${CHAPTER_NUM}]+)章$`))
      if (!match) return null
      const number = chineseToNumber(match[1])
      return { type: 'chapter', title: `第${match[1]}章`, number }
    },
  },

  pingfandeshijie: {
    id: 'pingfandeshijie',
    title: '平凡的世界',
    author: '路遥',
    sourceFile: '平凡的世界.txt',
    sourceUrl:
      'https://raw.githubusercontent.com/BlankRain/ebooks/master/平凡的世界-路遥_TXT小说天堂.txt',
    defaultVolumeName: '第一部',
    expectedChapterCounts: [53, 54, 54],
    classify(line) {
      const combo = line.match(
        new RegExp(`^(第[一二三]部)\\s+(第[${CHAPTER_NUM}]+章)$`)
      )
      if (combo) {
        return {
          type: 'volume-chapter',
          volumeName: combo[1],
          title: combo[2],
          number: chapterNumberFromTitle(combo[2]),
        }
      }
      const chapter = line.match(new RegExp(`^第[${CHAPTER_NUM}]+章$`))
      if (!chapter) return null
      return {
        type: 'chapter',
        title: chapter[0],
        number: chapterNumberFromTitle(chapter[0]),
      }
    },
  },

  leiyu: {
    id: 'leiyu',
    title: '雷雨',
    author: '曹禺',
    sourceFile: '雷雨.txt',
    defaultVolumeName: '雷雨',
    skipUntil: /^★+\s*人物/,
    unwrap: 'play',
    expectedChapterCounts: [7],
    classify(line) {
      const match = line.match(/^★+\s*(人物|序幕|第一幕|第二幕|第三幕|第四幕|尾声)\s*★+\s*$/)
      if (!match) return null
      return { type: 'chapter', title: match[1] }
    },
  },

  balishengmuyuan: {
    id: 'balishengmuyuan',
    title: '巴黎圣母院',
    author: '维克多·雨果',
    translator: '陈敬容',
    sourceFile: '巴黎圣母院.txt',
    defaultVolumeName: '第一卷',
    skipUntil: /^第一卷$/,
    expectedChapterCounts: [6, 7, 2, 6, 2, 5, 8, 6, 6, 7, 4],
    classify(line) {
      if (/^第[一二三四五六七八九十]+卷$/.test(line)) {
        return { type: 'volume', volumeName: line, title: line }
      }
      const match = line.match(
        new RegExp(`^第([${CHAPTER_NUM}]+)章(?:\\s+(.+))?$`)
      )
      if (!match) return null
      return { type: 'chapter', title: line, number: chineseToNumber(match[1]) }
    },
  },

  laorenyuhai: {
    id: 'laorenyuhai',
    title: '老人与海',
    author: '海明威',
    sourceFile: '老人与海.txt',
    sourceUrl:
      'https://raw.githubusercontent.com/BlankRain/ebooks/master/老人与海_海明威_TXT小说天堂.txt',
    defaultVolumeName: '老人与海',
    skipUntil: /^老人与海\(1\)$/,
    stopAt: /^完$/,
    expectedChapterCounts: [4],
    classify(line) {
      const match = line.match(/^老人与海\((\d+)\)$/)
      if (!match) return null
      const number = Number(match[1])
      return { type: 'chapter', title: `第${number}节`, number }
    },
  },

  ouyenigelangtai: {
    id: 'ouyenigelangtai',
    title: '欧也妮·葛朗台',
    author: '巴尔扎克',
    sourceFile: '欧也妮·葛朗台.txt',
    sourceUrl:
      'https://raw.githubusercontent.com/BlankRain/ebooks/master/欧也妮·葛朗台_巴尔扎克_TXT小说天堂.txt',
    defaultVolumeName: '欧也妮·葛朗台',
    skipUntil: /^第一节$/,
    expectedChapterCounts: [10],
    classify(line) {
      const match = line.match(new RegExp(`^第([${CHAPTER_NUM}]+)节$`))
      if (!match) return null
      return {
        type: 'chapter',
        title: `第${match[1]}节`,
        number: chineseToNumber(match[1]),
      }
    },
  },

  lunyu: {
    id: 'lunyu',
    title: '论语',
    author: '孔子及其弟子',
    sourceFile: '论语.txt',
    sourceUrl: 'https://raw.githubusercontent.com/ahua/dataset/master/儒家/论语.txt',
    defaultVolumeName: '论语',
    stripXml: true,
    expectedChapterCounts: [20],
    classify(line) {
      const match = line.match(
        /^(学而第一|为政第二|八佾第三|里仁第四|公冶长第五|雍也第六|述而第七|泰伯第八|子罕第九|乡党第十|先进第十一|颜渊第十二|子路第十三|宪问第十四|卫灵公第十五|季氏第十六|阳货第十七|微子第十八|子张第十九|尧曰第二十)$/
      )
      if (!match) return null
      return { type: 'chapter', title: match[1] }
    },
  },

  sanguoyanyi: {
    id: 'sanguoyanyi',
    title: '三国演义',
    author: '罗贯中',
    sourceFile: '三国演义.txt',
    sourceUrl: 'https://raw.githubusercontent.com/tennessine/corpus/master/三国演义.txt',
    defaultVolumeName: '三国演义',
    unwrap: 'hardwrap',
    expectedChapterCounts: [120],
    classify(line) {
      const match = line.match(new RegExp(`^第[${CHAPTER_NUM}]+回`))
      if (!match) return null
      const numberMatch = line.match(new RegExp(`^第([${CHAPTER_NUM}]+)回`))
      return {
        type: 'chapter',
        title: line.replace(/\u3000/g, ' '),
        number: numberMatch ? chineseToNumber(numberMatch[1]) : undefined,
      }
    },
  },
}

export const VOLUME_BOOK_IDS = Object.keys(VOLUME_BOOKS)
