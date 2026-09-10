import { describe, expect, it } from 'vitest'
import { isNarratableParagraph, splitVolumeParagraphs } from '../volumeParagraphs'

describe('splitVolumeParagraphs', () => {
  it('keeps whitespace-only parts so pair indexes stay stable', () => {
    const paragraphs = splitVolumeParagraphs('标题\n\n  \n\n正文一段\n\n\n结尾')
    expect(paragraphs).toEqual(['标题', '  ', '正文一段', '结尾'])
    expect(paragraphs.map(isNarratableParagraph)).toEqual([true, false, true, true])
  })

  it('drops empty strings created by leading or trailing breaks', () => {
    expect(splitVolumeParagraphs('\n\n只有一段\n\n')).toEqual(['只有一段'])
  })

  it('splits Windows CRLF text into the same paragraphs as Unix text', () => {
    const unix = '一件小事\n\n  \n\n  我从乡下跑到京城里。\n\n  （一九二○年七月。）'
    const windows = unix.replace(/\n/g, '\r\n')
    expect(splitVolumeParagraphs(windows)).toEqual(splitVolumeParagraphs(unix))
    expect(splitVolumeParagraphs(windows)).toHaveLength(4)
  })
})
