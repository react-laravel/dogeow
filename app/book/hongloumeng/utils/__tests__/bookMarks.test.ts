import { describe, expect, it } from 'vitest'
import { buildAiPromptForExcerpt, buildBookMark, sortBookMarks } from '../bookMarks'

describe('bookMarks', () => {
  it('builds ai prompt with chapter title and excerpt', () => {
    const prompt = buildAiPromptForExcerpt('此开卷第一回也。', '第1章 甄士隐梦幻识通灵')
    expect(prompt).toContain('《红楼梦》')
    expect(prompt).toContain('此开卷第一回也。')
    expect(prompt).toContain('我的问题：')
  })

  it('creates and sorts marks by created time desc', () => {
    const older = buildBookMark({
      kind: 'collection',
      chapterId: 1,
      chapterTitle: '第一章',
      scrollTop: 10,
      excerpt: '甲',
    })
    const newer = buildBookMark({
      kind: 'position',
      chapterId: 2,
      chapterTitle: '第二章',
      scrollTop: 20,
      excerpt: '乙',
    })

    const sorted = sortBookMarks([
      { ...older, createdAt: 100 },
      { ...newer, createdAt: 200 },
    ])

    expect(sorted[0]?.createdAt).toBe(200)
  })
})
