import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const storeBookMark = vi.fn()
const removeBookMark = vi.fn()
const fetchBookMarks = vi.fn()

vi.mock('@/stores/authStore', () => ({
  default: (selector: (s: { token: string | null }) => unknown) =>
    selector({ token: 'test-token' }),
}))

vi.mock('../bookMarkApi', () => ({
  fetchBookMarks: (...args: unknown[]) => fetchBookMarks(...args),
  storeBookMark: (...args: unknown[]) => storeBookMark(...args),
  removeBookMark: (...args: unknown[]) => removeBookMark(...args),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))

import { useBookMarks } from '../bookMarks'

describe('useBookMarks', () => {
  beforeEach(() => {
    fetchBookMarks.mockResolvedValue([])
    storeBookMark.mockReset()
    removeBookMark.mockReset()
  })

  it('rolls back optimistic mark when store fails', async () => {
    storeBookMark.mockRejectedValue(new Error('network'))

    const { result } = renderHook(() => useBookMarks('hongloumeng'))

    await waitFor(() => {
      expect(fetchBookMarks).toHaveBeenCalled()
    })

    act(() => {
      result.current.addPositionBookmark({
        chapterId: '1',
        chapterTitle: '第一回',
        scrollTop: 120,
        pairIndex: 2,
      })
    })

    expect(result.current.marks).toHaveLength(1)

    await waitFor(() => {
      expect(result.current.marks).toHaveLength(0)
    })
  })

  it('restores mark when remove fails', async () => {
    const remoteMark = {
      id: 'm1',
      bookId: 'hongloumeng',
      kind: 'position' as const,
      chapterId: '1',
      chapterTitle: '第一回',
      scrollTop: 10,
      pairIndex: 0,
      excerpt: '',
      note: '',
      createdAt: Date.now(),
    }
    fetchBookMarks.mockResolvedValue([remoteMark])
    removeBookMark.mockRejectedValue(new Error('network'))

    const { result } = renderHook(() => useBookMarks('hongloumeng'))

    await waitFor(() => {
      expect(result.current.marks).toHaveLength(1)
    })

    act(() => {
      result.current.removeMark('m1')
    })

    expect(result.current.marks).toHaveLength(0)

    await waitFor(() => {
      expect(result.current.marks).toHaveLength(1)
      expect(result.current.marks[0]?.id).toBe('m1')
    })
  })
})
