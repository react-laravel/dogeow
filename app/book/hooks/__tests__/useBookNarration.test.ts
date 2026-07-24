import { describe, expect, it } from 'vitest'
import { getPairNarrationParts } from '../useBookNarration'

describe('getPairNarrationParts', () => {
  const pair = { o: '原文一句', t: '译文一句' }

  it('uses original text in original mode', () => {
    const result = getPairNarrationParts(pair, 'original')
    expect(result.text).toBe('原文一句')
    expect(result.segments).toEqual([{ role: 'original', text: '原文一句', start: 0, end: 4 }])
  })

  it('uses translation text in translation mode', () => {
    const result = getPairNarrationParts(pair, 'translation')
    expect(result.text).toBe('译文一句')
    expect(result.segments[0]?.role).toBe('translation')
  })

  it('concatenates both with separator in both mode', () => {
    const result = getPairNarrationParts(pair, 'both')
    expect(result.text).toBe('原文一句。译文一句')
    expect(result.segments).toHaveLength(2)
    expect(result.segments[1]?.start).toBe('原文一句。'.length)
  })
})
