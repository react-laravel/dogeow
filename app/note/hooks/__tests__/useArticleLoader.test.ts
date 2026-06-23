import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useArticleLoader } from '../useArticleLoader'

const { mockGetArticle, mockLoggerError } = vi.hoisted(() => ({
  mockGetArticle: vi.fn(),
  mockLoggerError: vi.fn(),
}))

vi.mock('@/lib/api/wiki', () => ({
  getArticle: mockGetArticle,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: mockLoggerError,
  },
}))

describe('useArticleLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useArticleLoader())

    expect(result.current.articleHtml).toBe('')
    expect(result.current.articleRaw).toBe('')
    expect(result.current.articleJson).toBeNull()
    expect(result.current.loadingArticle).toBe(false)
    expect(result.current.articleError).toBe('')
  })

  it('should load article successfully with html content', async () => {
    const mockArticle = {
      html: '<p>Hello World</p>',
      content_markdown: '# Hello',
      content: null,
    }
    mockGetArticle.mockResolvedValue(mockArticle)

    const { result } = renderHook(() => useArticleLoader())

    await act(async () => {
      await result.current.loadArticle('test-slug')
    })

    expect(mockGetArticle).toHaveBeenCalledWith('test-slug')
    expect(result.current.articleHtml).toBe('<p>Hello World</p>')
    expect(result.current.articleRaw).toBe('# Hello')
    expect(result.current.articleJson).toBeNull()
    expect(result.current.loadingArticle).toBe(false)
    expect(result.current.articleError).toBe('')
  })

  it('should load article with JSON content', async () => {
    const jsonContent = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
    }
    const mockArticle = {
      html: '',
      content_markdown: '',
      content: JSON.stringify(jsonContent),
    }
    mockGetArticle.mockResolvedValue(mockArticle)

    const { result } = renderHook(() => useArticleLoader())

    await act(async () => {
      await result.current.loadArticle('test-slug')
    })

    expect(result.current.articleJson).toEqual(jsonContent)
    expect(result.current.articleRaw).toBe('')
    expect(result.current.articleHtml).toBe('')
    expect(result.current.articleError).toBe('')
  })

  it('should load article with raw string content', async () => {
    const mockArticle = {
      html: '',
      content_markdown: '',
      content: 'plain text content',
    }
    mockGetArticle.mockResolvedValue(mockArticle)

    const { result } = renderHook(() => useArticleLoader())

    await act(async () => {
      await result.current.loadArticle('test-slug')
    })

    expect(result.current.articleRaw).toBe('plain text content')
    expect(result.current.articleJson).toBeNull()
    expect(result.current.articleError).toBe('')
  })

  it('should ignore html that looks like JSON', async () => {
    const mockArticle = {
      html: '{"key": "value"}',
      content_markdown: '',
      content: null,
    }
    mockGetArticle.mockResolvedValue(mockArticle)

    const { result } = renderHook(() => useArticleLoader())

    await act(async () => {
      await result.current.loadArticle('test-slug')
    })

    expect(result.current.articleHtml).toBe('')
    expect(result.current.articleError).toBe('文章暂无内容')
  })

  it('should set article error when article is null', async () => {
    mockGetArticle.mockResolvedValue(null)

    const { result } = renderHook(() => useArticleLoader())

    await act(async () => {
      await result.current.loadArticle('test-slug')
    })

    expect(result.current.articleError).toBe('未获取到文章内容')
    expect(result.current.articleHtml).toBe('')
    expect(result.current.articleRaw).toBe('')
    expect(result.current.articleJson).toBeNull()
  })

  it('should set article error when no content is available', async () => {
    const mockArticle = {
      html: '',
      content_markdown: '',
      content: '',
    }
    mockGetArticle.mockResolvedValue(mockArticle)

    const { result } = renderHook(() => useArticleLoader())

    await act(async () => {
      await result.current.loadArticle('test-slug')
    })

    expect(result.current.articleError).toBe('文章暂无内容')
  })

  it('should handle load errors gracefully', async () => {
    const error = new Error('Network error')
    mockGetArticle.mockRejectedValue(error)

    const { result } = renderHook(() => useArticleLoader())

    await act(async () => {
      await result.current.loadArticle('test-slug')
    })

    expect(result.current.articleError).toBe('Network error')
    expect(result.current.loadingArticle).toBe(false)
  })

  it('should handle unknown error type', async () => {
    mockGetArticle.mockRejectedValue('unknown error')

    const { result } = renderHook(() => useArticleLoader())

    await act(async () => {
      await result.current.loadArticle('test-slug')
    })

    expect(result.current.articleError).toBe('unknown error')
  })

  it('should set loading state correctly during load', async () => {
    let resolveLoad: (value: unknown) => void
    const loadPromise = new Promise(resolve => {
      resolveLoad = resolve
    })
    mockGetArticle.mockReturnValue(loadPromise)

    const { result } = renderHook(() => useArticleLoader())

    await act(async () => {
      result.current.loadArticle('test-slug')
    })

    expect(result.current.loadingArticle).toBe(true)

    await act(async () => {
      resolveLoad!({
        html: '<p>content</p>',
        content_markdown: 'markdown',
        content: null,
      })
    })

    expect(result.current.loadingArticle).toBe(false)
  })

  it('should reset article state', async () => {
    const mockArticle = {
      html: '<p>Hello</p>',
      content_markdown: '# Hello',
      content: null,
    }
    mockGetArticle.mockResolvedValue(mockArticle)

    const { result } = renderHook(() => useArticleLoader())

    await act(async () => {
      await result.current.loadArticle('test-slug')
    })

    expect(result.current.articleHtml).toBe('<p>Hello</p>')

    act(() => {
      result.current.resetArticle()
    })

    expect(result.current.articleHtml).toBe('')
    expect(result.current.articleRaw).toBe('')
    expect(result.current.articleJson).toBeNull()
    expect(result.current.articleError).toBe('')
  })

  it('should clear error before loading new article', async () => {
    mockGetArticle.mockRejectedValueOnce(new Error('First error'))

    const { result } = renderHook(() => useArticleLoader())

    await act(async () => {
      await result.current.loadArticle('test-slug')
    })

    expect(result.current.articleError).toBe('First error')

    mockGetArticle.mockResolvedValue({
      html: '<p>content</p>',
      content_markdown: 'markdown',
      content: null,
    })

    await act(async () => {
      await result.current.loadArticle('test-slug')
    })

    expect(result.current.articleError).toBe('')
    expect(result.current.articleHtml).toBe('<p>content</p>')
  })

  it('should parse object content directly', async () => {
    const jsonContent = { type: 'doc', content: [{ type: 'paragraph', content: [] }] }
    const mockArticle = {
      html: '',
      content_markdown: 'markdown',
      content: jsonContent,
    }
    mockGetArticle.mockResolvedValue(mockArticle)

    const { result } = renderHook(() => useArticleLoader())

    await act(async () => {
      await result.current.loadArticle('test-slug')
    })

    expect(result.current.articleJson).toEqual(jsonContent)
    expect(result.current.articleRaw).toBe('markdown')
  })

  it('should prefer markdown over raw string content', async () => {
    const mockArticle = {
      html: '',
      content_markdown: '# Markdown Title',
      content: 'plain text content',
    }
    mockGetArticle.mockResolvedValue(mockArticle)

    const { result } = renderHook(() => useArticleLoader())

    await act(async () => {
      await result.current.loadArticle('test-slug')
    })

    expect(result.current.articleRaw).toBe('# Markdown Title')
  })

  it('should use raw string content when no markdown is available', async () => {
    const mockArticle = {
      html: '',
      content_markdown: '',
      content: 'plain text content',
    }
    mockGetArticle.mockResolvedValue(mockArticle)

    const { result } = renderHook(() => useArticleLoader())

    await act(async () => {
      await result.current.loadArticle('test-slug')
    })

    expect(result.current.articleRaw).toBe('plain text content')
  })
})
