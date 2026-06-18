import { describe, expect, it } from 'vitest'
import { pairSentences, parseHongloumengText, splitChineseSentences } from '../parseBook'

describe('parseBook', () => {
  it('splits long paragraphs into sentences and pairs with translation', () => {
    const sample = `第1章 测试章
　　此开卷第一回也。
【译文】这是开卷的第一回。

　　作者自云：因曾历过一番梦幻之后，故将真事隐去。又说："今风尘碌碌，一事无成。"
【译文】作者自己说：因为曾经历过一番梦幻，所以把真事隐藏起来。又说："如今风尘仆仆、碌碌无为。"

　　无才可去补苍天，枉入红尘若许年。
【译文】没有才能去补苍天，白白在红尘里蹉跎这么多年。`

    const chapters = parseHongloumengText(sample)
    expect(chapters).toHaveLength(1)
    expect(chapters[0]?.pairs[0]).toEqual({
      o: '此开卷第一回也。',
      t: '这是开卷的第一回。',
    })

    const longPair = chapters[0]?.pairs.find(pair => pair.o.includes('作者自云'))
    expect(longPair?.o).toBe('作者自云：因曾历过一番梦幻之后，故将真事隐去。')
    expect(longPair?.t).toBe('作者自己说：因为曾经历过一番梦幻，所以把真事隐藏起来。')

    const poemPair = chapters[0]?.pairs.at(-1)
    expect(poemPair).toEqual({
      o: '无才可去补苍天，枉入红尘若许年。',
      t: '没有才能去补苍天，白白在红尘里蹉跎这么多年。',
    })
  })

  it('pairs unequal sentence counts by filling missing side', () => {
    const pairs = pairSentences(
      splitChineseSentences('第一句。第二句。'),
      splitChineseSentences('译文一。')
    )
    expect(pairs).toHaveLength(2)
    expect(pairs[1]).toEqual({ o: '第二句。', t: '' })
  })
})
