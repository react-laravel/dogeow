import { describe, expect, it } from 'vitest'
import {
  alignSentencePairs,
  mergeContinuationSentences,
  pairSentences,
  parseHongloumengText,
  splitChapterHeading,
  splitChineseSentences,
} from '../bilingualParse'

describe('bilingualParse', () => {
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

  it('merges misaligned sentences when translation uses fewer full stops', () => {
    const original =
      "至于才子佳人等书，则又开口'文君'，满篇'子建'，千部一腔，千人一面。且终不能不涉淫滥。在作者，不过要写出自己的两首情诗艳赋来。"
    const translation =
      '至于才子佳人等书，开口就是文君，满篇都是子建，千部一腔、千人一面，且终不免淫滥。作者不过想写出自己的几首情诗艳赋。'

    const pairs = alignSentencePairs(
      mergeContinuationSentences(splitChineseSentences(original)),
      splitChineseSentences(translation)
    )

    expect(pairs[0]?.o).toBe(
      "至于才子佳人等书，则又开口'文君'，满篇'子建'，千部一腔，千人一面。且终不能不涉淫滥。"
    )
    expect(pairs[0]?.t).toContain('且终不免淫滥')
    expect(pairs.some(pair => pair.o === '且终不能不涉淫滥。')).toBe(false)
  })

  it('splits chapter heading into aligned prefix and body', () => {
    expect(splitChapterHeading('第01回 甄士隐梦幻识通灵 贾雨村风尘怀闺秀')).toEqual({
      prefix: '第01回',
      body: '甄士隐梦幻识通灵 贾雨村风尘怀闺秀',
    })
    expect(splitChapterHeading('第一回 甄士隐梦幻识通灵 贾雨村风尘怀闺秀')).toEqual({
      prefix: '第一回',
      body: '甄士隐梦幻识通灵 贾雨村风尘怀闺秀',
    })
  })
})
