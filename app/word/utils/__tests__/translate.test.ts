import { describe, expect, it, vi, beforeEach } from 'vitest'

const post = vi.fn()

vi.mock('@/lib/api', () => ({
  post: (...args: unknown[]) => post(...args),
}))

import { translateEnToZh } from '../translate'

describe('translateEnToZh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty string for blank input without calling API', async () => {
    await expect(translateEnToZh('  ')).resolves.toBe('')
    expect(post).not.toHaveBeenCalled()
  })

  it('posts to word/translate and returns text', async () => {
    post.mockResolvedValue({ text: '你好' })
    await expect(translateEnToZh('hello')).resolves.toBe('你好')
    expect(post).toHaveBeenCalledWith(
      'word/translate',
      { text: 'hello', langpair: 'en|zh' },
      { handleError: false }
    )
  })

  it('falls back to original text when API returns empty', async () => {
    post.mockResolvedValue({ text: '' })
    await expect(translateEnToZh('hello')).resolves.toBe('hello')
  })
})
