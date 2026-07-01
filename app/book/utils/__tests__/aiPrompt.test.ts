import { describe, expect, it } from 'vitest'
import { buildAiPromptForExcerpt } from '../aiPrompt'

describe('buildAiPromptForExcerpt', () => {
  it('includes book title, chapter title and excerpt', () => {
    const prompt = buildAiPromptForExcerpt('此开卷第一回也。', '第1章 甄士隐梦幻识通灵', '红楼梦')
    expect(prompt).toContain('《红楼梦》')
    expect(prompt).toContain('此开卷第一回也。')
    expect(prompt).toContain('我的问题：')
  })
})
