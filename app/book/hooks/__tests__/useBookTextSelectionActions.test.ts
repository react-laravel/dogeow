import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBookTextSelectionActions } from '../useBookTextSelectionActions'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/stores/aiDialogStore', () => ({
  useAiDialogStore: (selector: (s: { requestOpen: (p: string) => void }) => unknown) =>
    selector({ requestOpen: vi.fn() }),
}))

import { toast } from 'sonner'

describe('useBookTextSelectionActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('toasts info when collection already exists', () => {
    const addCollection = vi.fn(() => ({ mark: { id: '1' }, created: false }))
    const { result } = renderHook(() =>
      useBookTextSelectionActions({
        bookTitle: '鲁迅全集',
        getContext: () => ({
          chapterId: '0-0',
          chapterTitle: '一觉',
          scrollTop: 10,
          pairIndex: 0,
        }),
        addPositionBookmark: vi.fn(() => ({ created: true })),
        addCollection,
      })
    )

    act(() => {
      result.current.handleAddCollection({
        text: '摘录',
        pairIndex: 0,
        rect: { top: 0, left: 0, width: 0, height: 0 },
      } as never)
    })

    expect(addCollection).toHaveBeenCalled()
    expect(toast.info).toHaveBeenCalledWith('该片段已在收藏中')
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('toasts success when collection is created', () => {
    const addCollection = vi.fn(() => ({ mark: { id: '2' }, created: true }))
    const { result } = renderHook(() =>
      useBookTextSelectionActions({
        bookTitle: '鲁迅全集',
        getContext: () => ({
          chapterId: '0-0',
          chapterTitle: '一觉',
          scrollTop: 10,
          pairIndex: 0,
        }),
        addPositionBookmark: vi.fn(() => ({ created: true })),
        addCollection,
      })
    )

    act(() => {
      result.current.handleAddCollection({
        text: '新摘录',
        pairIndex: 1,
        rect: { top: 0, left: 0, width: 0, height: 0 },
      } as never)
    })

    expect(toast.success).toHaveBeenCalledWith('已加入收藏')
  })
})
