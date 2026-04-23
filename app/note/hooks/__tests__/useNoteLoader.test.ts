import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNoteLoader } from '../useNoteLoader'

const { mockLoggerError } = vi.hoisted(() => ({
  mockLoggerError: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: mockLoggerError,
  },
}))

describe('useNoteLoader', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    window.localStorage.clear()
  })

  it('should clear a previous error when loading a different note succeeds', async () => {
    const firstError = new Error('network down')
    const loadedNote = {
      id: 2,
      title: '恢复成功的笔记',
      content:
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"hello"}]}]}',
      content_markdown: 'hello',
      is_draft: false,
    }

    let resolveSecondRequest: ((value: { note: typeof loadedNote }) => void) | undefined
    const secondRequest = new Promise<{ note: typeof loadedNote }>(resolve => {
      resolveSecondRequest = resolve
    })

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest)
      .mockRejectedValueOnce(firstError)
      .mockImplementationOnce(() => secondRequest)

    const { result, rerender } = renderHook(({ noteId }) => useNoteLoader(noteId), {
      initialProps: { noteId: '1' },
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('无法加载笔记，请重试')
    })

    expect(mockLoggerError).toHaveBeenCalledWith('获取笔记失败', firstError)

    rerender({ noteId: '2' })

    await waitFor(() => {
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBeNull()
    })

    resolveSecondRequest?.({ note: loadedNote })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note?.id).toBe(2)
      expect(result.current.error).toBeNull()
    })
  })

  it('should re-enter loading when fetching a different note', async () => {
    const firstNote = {
      id: 1,
      title: '第一篇笔记',
      content:
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"first"}]}]}',
      content_markdown: 'first markdown',
      is_draft: false,
    }
    const secondNote = {
      id: 2,
      title: '第二篇笔记',
      content: '',
      content_markdown: '',
      is_draft: false,
    }

    let resolveSecondRequest: ((value: { note: typeof secondNote }) => void) | undefined
    const secondRequest = new Promise<{ note: typeof secondNote }>(resolve => {
      resolveSecondRequest = resolve
    })

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({ note: firstNote })
      .mockImplementationOnce(() => secondRequest)

    const { result, rerender } = renderHook(({ noteId }) => useNoteLoader(noteId), {
      initialProps: { noteId: '1' },
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note?.id).toBe(1)
    })

    expect(window.localStorage.getItem('novel-content')).toContain('first')
    expect(window.localStorage.getItem('markdown')).toBe('first markdown')

    rerender({ noteId: '2' })

    expect(result.current.loading).toBe(true)
    expect(result.current.note).toBeNull()
    expect(result.current.error).toBeNull()
    expect(window.localStorage.getItem('novel-content')).toBeNull()
    expect(window.localStorage.getItem('markdown')).toBeNull()

    await waitFor(() => {
      expect(result.current.loading).toBe(true)
    })

    resolveSecondRequest?.({ note: secondNote })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note?.id).toBe(2)
    })

    expect(window.localStorage.getItem('novel-content')).toBeNull()
    expect(window.localStorage.getItem('markdown')).toBeNull()
  })

  it('should ignore an older request that resolves after a newer note has loaded', async () => {
    const firstNote = {
      id: 1,
      title: '旧笔记',
      content:
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"old"}]}]}',
      content_markdown: 'old markdown',
      is_draft: false,
    }
    const secondNote = {
      id: 2,
      title: '新笔记',
      content:
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"new"}]}]}',
      content_markdown: 'new markdown',
      is_draft: false,
    }

    let resolveFirstRequest: ((value: { note: typeof firstNote }) => void) | undefined
    let resolveSecondRequest: ((value: { note: typeof secondNote }) => void) | undefined

    const firstRequest = new Promise<{ note: typeof firstNote }>(resolve => {
      resolveFirstRequest = resolve
    })
    const secondRequest = new Promise<{ note: typeof secondNote }>(resolve => {
      resolveSecondRequest = resolve
    })

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest)
      .mockImplementationOnce(() => firstRequest)
      .mockImplementationOnce(() => secondRequest)

    const { result, rerender } = renderHook(({ noteId }) => useNoteLoader(noteId), {
      initialProps: { noteId: '1' },
    })

    rerender({ noteId: '2' })

    resolveSecondRequest?.({ note: secondNote })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note?.id).toBe(2)
    })

    await act(async () => {
      resolveFirstRequest?.({ note: firstNote })
    })

    expect(result.current.note?.id).toBe(2)
    expect(window.localStorage.getItem('markdown')).toBe('new markdown')
  })

  it('should clear a stale note when a later load fails', async () => {
    const loadedNote = {
      id: 1,
      title: '已加载笔记',
      content:
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"persisted"}]}]}',
      content_markdown: 'persisted markdown',
      is_draft: false,
    }
    const secondError = new Error('second load failed')

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({ note: loadedNote })
      .mockRejectedValueOnce(secondError)

    const { result, rerender } = renderHook(({ noteId }) => useNoteLoader(noteId), {
      initialProps: { noteId: '1' },
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note?.id).toBe(1)
    })

    expect(window.localStorage.getItem('novel-content')).toContain('persisted')
    expect(window.localStorage.getItem('markdown')).toBe('persisted markdown')

    rerender({ noteId: '2' })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note).toBeNull()
      expect(result.current.error).toBe('无法加载笔记，请重试')
    })

    expect(mockLoggerError).toHaveBeenCalledWith('获取笔记失败', secondError)
    expect(window.localStorage.getItem('novel-content')).toBeNull()
    expect(window.localStorage.getItem('markdown')).toBeNull()
  })

  it('should ignore an older failed request after a newer note has loaded', async () => {
    const secondNote = {
      id: 2,
      title: '最新笔记',
      content:
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"latest"}]}]}',
      content_markdown: 'latest markdown',
      is_draft: false,
    }
    const firstError = new Error('stale request failed')

    let rejectFirstRequest: ((reason?: Error) => void) | undefined
    let resolveSecondRequest: ((value: { note: typeof secondNote }) => void) | undefined

    const firstRequest = new Promise<{ note: never }>((_resolve, reject) => {
      rejectFirstRequest = reject
    })
    const secondRequest = new Promise<{ note: typeof secondNote }>(resolve => {
      resolveSecondRequest = resolve
    })

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest)
      .mockImplementationOnce(() => firstRequest)
      .mockImplementationOnce(() => secondRequest)

    const { result, rerender } = renderHook(({ noteId }) => useNoteLoader(noteId), {
      initialProps: { noteId: '1' },
    })

    rerender({ noteId: '2' })
    resolveSecondRequest?.({ note: secondNote })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note?.id).toBe(2)
    })

    await act(async () => {
      rejectFirstRequest?.(firstError)
    })

    expect(result.current.note?.id).toBe(2)
    expect(result.current.error).toBeNull()
    expect(window.localStorage.getItem('markdown')).toBe('latest markdown')
  })

  it('should reject malformed note payloads and clear stale state', async () => {
    window.localStorage.setItem('novel-content', '{"type":"doc"}')
    window.localStorage.setItem('markdown', 'stale markdown')

    const malformedPayload = { note: {} }

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest).mockResolvedValueOnce(malformedPayload)

    const { result } = renderHook(() => useNoteLoader('1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note).toBeNull()
      expect(result.current.error).toBe('无法加载笔记，请重试')
    })

    expect(mockLoggerError).toHaveBeenCalledWith('获取笔记返回了无效数据', malformedPayload)
    expect(window.localStorage.getItem('novel-content')).toBeNull()
    expect(window.localStorage.getItem('markdown')).toBeNull()
  })

  it('should reject a note payload whose id does not match the requested route', async () => {
    const mismatchedNote = {
      id: 99,
      title: '错误的笔记',
      content: '',
      content_markdown: '',
      is_draft: false,
    }

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest).mockResolvedValueOnce({ note: mismatchedNote })

    const { result } = renderHook(() => useNoteLoader('1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note).toBeNull()
      expect(result.current.error).toBe('无法加载笔记，请重试')
    })

    expect(mockLoggerError).toHaveBeenCalledWith('获取笔记返回了无效数据', {
      note: mismatchedNote,
    })
    expect(window.localStorage.getItem('novel-content')).toBeNull()
    expect(window.localStorage.getItem('markdown')).toBeNull()
  })

  it('should ignore an older response after leaving and re-entering the same note id', async () => {
    const staleFirstNote = {
      id: 1,
      title: '旧的第一篇笔记',
      content:
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"stale"}]}]}',
      content_markdown: 'stale markdown',
      is_draft: false,
    }
    const freshReturnedNote = {
      id: 1,
      title: '重新进入后的第一篇笔记',
      content:
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"fresh"}]}]}',
      content_markdown: 'fresh markdown',
      is_draft: false,
    }

    let resolveFirstRequest: ((value: { note: typeof staleFirstNote }) => void) | undefined
    let resolveSecondRequest: ((value: { note: typeof freshReturnedNote }) => void) | undefined
    let resolveMiddleRequest:
      | ((value: {
          note: {
            id: number
            title: string
            content: string
            content_markdown: string
            is_draft: boolean
          }
        }) => void)
      | undefined

    const firstRequest = new Promise<{ note: typeof staleFirstNote }>(resolve => {
      resolveFirstRequest = resolve
    })
    const middleRequest = new Promise<{
      note: {
        id: number
        title: string
        content: string
        content_markdown: string
        is_draft: boolean
      }
    }>(resolve => {
      resolveMiddleRequest = resolve
    })
    const secondRequest = new Promise<{ note: typeof freshReturnedNote }>(resolve => {
      resolveSecondRequest = resolve
    })

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest)
      .mockImplementationOnce(() => firstRequest)
      .mockImplementationOnce(() => middleRequest)
      .mockImplementationOnce(() => secondRequest)

    const { result, rerender } = renderHook(({ noteId }) => useNoteLoader(noteId), {
      initialProps: { noteId: '1' },
    })

    rerender({ noteId: '2' })
    resolveMiddleRequest?.({
      note: {
        id: 2,
        title: '第二篇笔记',
        content: '',
        content_markdown: '',
        is_draft: false,
      },
    })

    rerender({ noteId: '1' })
    resolveSecondRequest?.({ note: freshReturnedNote })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note?.title).toBe('重新进入后的第一篇笔记')
      expect(window.localStorage.getItem('markdown')).toBe('fresh markdown')
    })

    await act(async () => {
      resolveFirstRequest?.({ note: staleFirstNote })
    })

    expect(result.current.note?.title).toBe('重新进入后的第一篇笔记')
    expect(window.localStorage.getItem('markdown')).toBe('fresh markdown')
  })

  it('should ignore an older failed request after leaving and re-entering the same note id', async () => {
    const freshReturnedNote = {
      id: 1,
      title: '重新进入后的第一篇笔记',
      content:
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"fresh"}]}]}',
      content_markdown: 'fresh markdown',
      is_draft: false,
    }
    const firstError = new Error('stale same-id request failed')

    let rejectFirstRequest: ((reason?: Error) => void) | undefined
    let resolveSecondRequest: ((value: { note: typeof freshReturnedNote }) => void) | undefined
    let resolveMiddleRequest:
      | ((value: {
          note: {
            id: number
            title: string
            content: string
            content_markdown: string
            is_draft: boolean
          }
        }) => void)
      | undefined

    const firstRequest = new Promise<{ note: never }>((_resolve, reject) => {
      rejectFirstRequest = reject
    })
    const middleRequest = new Promise<{
      note: {
        id: number
        title: string
        content: string
        content_markdown: string
        is_draft: boolean
      }
    }>(resolve => {
      resolveMiddleRequest = resolve
    })
    const secondRequest = new Promise<{ note: typeof freshReturnedNote }>(resolve => {
      resolveSecondRequest = resolve
    })

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest)
      .mockImplementationOnce(() => firstRequest)
      .mockImplementationOnce(() => middleRequest)
      .mockImplementationOnce(() => secondRequest)

    const { result, rerender } = renderHook(({ noteId }) => useNoteLoader(noteId), {
      initialProps: { noteId: '1' },
    })

    rerender({ noteId: '2' })
    resolveMiddleRequest?.({
      note: {
        id: 2,
        title: '第二篇笔记',
        content: '',
        content_markdown: '',
        is_draft: false,
      },
    })

    rerender({ noteId: '1' })
    resolveSecondRequest?.({ note: freshReturnedNote })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note?.title).toBe('重新进入后的第一篇笔记')
      expect(result.current.error).toBeNull()
      expect(window.localStorage.getItem('markdown')).toBe('fresh markdown')
    })

    await act(async () => {
      rejectFirstRequest?.(firstError)
    })

    expect(result.current.note?.title).toBe('重新进入后的第一篇笔记')
    expect(result.current.error).toBeNull()
    expect(window.localStorage.getItem('markdown')).toBe('fresh markdown')
    expect(mockLoggerError).not.toHaveBeenCalledWith('获取笔记失败', firstError)
  })

  it('should keep a previously loaded same-id note hidden until the re-entered request resolves', async () => {
    const initiallyLoadedNote = {
      id: 1,
      title: '第一次加载的第一篇笔记',
      content:
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"first"}]}]}',
      content_markdown: 'first markdown',
      is_draft: false,
    }
    const freshReturnedNote = {
      id: 1,
      title: '重新进入后刷新出来的第一篇笔记',
      content:
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"fresh"}]}]}',
      content_markdown: 'fresh markdown',
      is_draft: false,
    }

    let resolveMiddleRequest:
      | ((value: {
          note: {
            id: number
            title: string
            content: string
            content_markdown: string
            is_draft: boolean
          }
        }) => void)
      | undefined
    let resolveReturnedRequest: ((value: { note: typeof freshReturnedNote }) => void) | undefined

    const middleRequest = new Promise<{
      note: {
        id: number
        title: string
        content: string
        content_markdown: string
        is_draft: boolean
      }
    }>(resolve => {
      resolveMiddleRequest = resolve
    })
    const returnedRequest = new Promise<{ note: typeof freshReturnedNote }>(resolve => {
      resolveReturnedRequest = resolve
    })

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({ note: initiallyLoadedNote })
      .mockImplementationOnce(() => middleRequest)
      .mockImplementationOnce(() => returnedRequest)

    const { result, rerender } = renderHook(({ noteId }) => useNoteLoader(noteId), {
      initialProps: { noteId: '1' },
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note?.title).toBe('第一次加载的第一篇笔记')
    })

    expect(window.localStorage.getItem('markdown')).toBe('first markdown')

    rerender({ noteId: '2' })

    await waitFor(() => {
      expect(result.current.loading).toBe(true)
      expect(result.current.note).toBeNull()
    })

    rerender({ noteId: '1' })

    expect(result.current.loading).toBe(true)
    expect(result.current.note).toBeNull()
    expect(result.current.error).toBeNull()

    expect(window.localStorage.getItem('novel-content')).toBeNull()
    expect(window.localStorage.getItem('markdown')).toBeNull()

    resolveReturnedRequest?.({ note: freshReturnedNote })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note?.title).toBe('重新进入后刷新出来的第一篇笔记')
      expect(window.localStorage.getItem('markdown')).toBe('fresh markdown')
    })

    await act(async () => {
      resolveMiddleRequest?.({
        note: {
          id: 2,
          title: '第二篇笔记',
          content: '',
          content_markdown: '',
          is_draft: false,
        },
      })
    })

    expect(result.current.note?.title).toBe('重新进入后刷新出来的第一篇笔记')
  })

  it('should keep the editor cache cleared when the re-entered same-id request fails', async () => {
    const initiallyLoadedNote = {
      id: 1,
      title: '第一次加载的第一篇笔记',
      content:
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"first"}]}]}',
      content_markdown: 'first markdown',
      is_draft: false,
    }
    const returnedError = new Error('re-entered request failed')

    let resolveMiddleRequest:
      | ((value: {
          note: {
            id: number
            title: string
            content: string
            content_markdown: string
            is_draft: boolean
          }
        }) => void)
      | undefined
    let rejectReturnedRequest: ((reason?: Error) => void) | undefined

    const middleRequest = new Promise<{
      note: {
        id: number
        title: string
        content: string
        content_markdown: string
        is_draft: boolean
      }
    }>(resolve => {
      resolveMiddleRequest = resolve
    })
    const returnedRequest = new Promise<{ note: never }>((_resolve, reject) => {
      rejectReturnedRequest = reject
    })

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({ note: initiallyLoadedNote })
      .mockImplementationOnce(() => middleRequest)
      .mockImplementationOnce(() => returnedRequest)

    const { result, rerender } = renderHook(({ noteId }) => useNoteLoader(noteId), {
      initialProps: { noteId: '1' },
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note?.title).toBe('第一次加载的第一篇笔记')
    })

    expect(window.localStorage.getItem('novel-content')).toContain('first')
    expect(window.localStorage.getItem('markdown')).toBe('first markdown')

    rerender({ noteId: '2' })

    await waitFor(() => {
      expect(result.current.loading).toBe(true)
      expect(result.current.note).toBeNull()
    })

    rerender({ noteId: '1' })

    expect(result.current.loading).toBe(true)
    expect(result.current.note).toBeNull()
    expect(result.current.error).toBeNull()
    expect(window.localStorage.getItem('novel-content')).toBeNull()
    expect(window.localStorage.getItem('markdown')).toBeNull()

    await act(async () => {
      rejectReturnedRequest?.(returnedError)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note).toBeNull()
      expect(result.current.error).toBe('无法加载笔记，请重试')
    })

    expect(window.localStorage.getItem('novel-content')).toBeNull()
    expect(window.localStorage.getItem('markdown')).toBeNull()
    expect(mockLoggerError).toHaveBeenCalledWith('获取笔记失败', returnedError)

    await act(async () => {
      resolveMiddleRequest?.({
        note: {
          id: 2,
          title: '第二篇笔记',
          content: '',
          content_markdown: '',
          is_draft: false,
        },
      })
    })

    expect(result.current.note).toBeNull()
    expect(result.current.error).toBe('无法加载笔记，请重试')
    expect(window.localStorage.getItem('novel-content')).toBeNull()
    expect(window.localStorage.getItem('markdown')).toBeNull()
  })

  it('should fall back to a safe doc structure when note content JSON is not an editor document', async () => {
    const malformedContentNote = {
      id: 3,
      title: '结构损坏的笔记',
      content: '{}',
      content_markdown: '',
      is_draft: false,
    }

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest).mockResolvedValueOnce({ note: malformedContentNote })

    const { result } = renderHook(() => useNoteLoader('3'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note?.id).toBe(3)
      expect(result.current.error).toBeNull()
    })

    const storedContent = JSON.parse(window.localStorage.getItem('novel-content') ?? 'null')
    expect(storedContent).toMatchObject({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '{}',
            },
          ],
        },
      ],
    })
  })

  it('should fall back to a safe doc structure when note content has corrupted nested nodes', async () => {
    const nestedCorruptionNote = {
      id: 5,
      title: '嵌套结构损坏的笔记',
      content: '{"type":"doc","content":[{"content":[]}]}',
      content_markdown: '',
      is_draft: false,
    }

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest).mockResolvedValueOnce({ note: nestedCorruptionNote })

    const { result } = renderHook(() => useNoteLoader('5'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note?.id).toBe(5)
      expect(result.current.error).toBeNull()
    })

    const storedContent = JSON.parse(window.localStorage.getItem('novel-content') ?? 'null')
    expect(storedContent).toMatchObject({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '{"type":"doc","content":[{"content":[]}]}',
            },
          ],
        },
      ],
    })
  })

  it('should fall back to a safe doc structure when a text leaf is missing its text value', async () => {
    const malformedTextLeafNote = {
      id: 6,
      title: '缺少 text 的叶子节点',
      content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text"}]}]}',
      content_markdown: '',
      is_draft: false,
    }

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest).mockResolvedValueOnce({ note: malformedTextLeafNote })

    const { result } = renderHook(() => useNoteLoader('6'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note?.id).toBe(6)
      expect(result.current.error).toBeNull()
    })

    const storedContent = JSON.parse(window.localStorage.getItem('novel-content') ?? 'null')
    expect(storedContent).toMatchObject({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text"}]}]}',
            },
          ],
        },
      ],
    })
  })

  it('should fall back when a text node incorrectly carries nested content', async () => {
    const malformedTextContainerNote = {
      id: 7,
      title: 'text 节点错误嵌套',
      content:
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","content":[]}]}]}',
      content_markdown: '',
      is_draft: false,
    }

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest).mockResolvedValueOnce({ note: malformedTextContainerNote })

    const { result } = renderHook(() => useNoteLoader('7'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note?.id).toBe(7)
      expect(result.current.error).toBeNull()
    })

    const storedContent = JSON.parse(window.localStorage.getItem('novel-content') ?? 'null')
    expect(storedContent).toMatchObject({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","content":[]}]}]}',
            },
          ],
        },
      ],
    })
  })

  it('should fall back when a non-text leaf carries a stray text field', async () => {
    const malformedNonTextLeafNote = {
      id: 8,
      title: '非 text 叶子带 text',
      content: '{"type":"doc","content":[{"type":"paragraph","text":"oops"}]}',
      content_markdown: '',
      is_draft: false,
    }

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest).mockResolvedValueOnce({ note: malformedNonTextLeafNote })

    const { result } = renderHook(() => useNoteLoader('8'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note?.id).toBe(8)
      expect(result.current.error).toBeNull()
    })

    const storedContent = JSON.parse(window.localStorage.getItem('novel-content') ?? 'null')
    expect(storedContent).toMatchObject({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '{"type":"doc","content":[{"type":"paragraph","text":"oops"}]}',
            },
          ],
        },
      ],
    })
  })

  it('should fall back to a safe doc structure when note content is invalid JSON', async () => {
    const invalidJsonNote = {
      id: 4,
      title: '无效 JSON 笔记',
      content: 'not-json',
      content_markdown: '',
      is_draft: false,
    }

    const { apiRequest } = await import('@/lib/api')
    vi.mocked(apiRequest).mockResolvedValueOnce({ note: invalidJsonNote })

    const { result } = renderHook(() => useNoteLoader('4'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.note?.id).toBe(4)
      expect(result.current.error).toBeNull()
    })

    const storedContent = JSON.parse(window.localStorage.getItem('novel-content') ?? 'null')
    expect(storedContent).toMatchObject({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'not-json',
            },
          ],
        },
      ],
    })
  })
})
