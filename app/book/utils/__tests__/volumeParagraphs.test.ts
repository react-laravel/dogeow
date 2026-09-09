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
})
