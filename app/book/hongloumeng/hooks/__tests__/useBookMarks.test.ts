import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useBookMarks } from '../useBookMarks'

describe('useBookMarks', () => {
  beforeEach(() => {
    localStorage.clear()
    const { result } = renderHook(() => useBookMarks())
    act(() => {
      result.current.clearMarks()
    })
  })

  it('does not add duplicate position bookmarks for the same chapter pair', () => {
    const { result } = renderHook(() => useBookMarks())

    let first: ReturnType<typeof result.current.addPositionBookmark> | undefined
    let second: ReturnType<typeof result.current.addPositionBookmark> | undefined

    act(() => {
      first = result.current.addPositionBookmark({
        chapterId: 1,
        chapterTitle: '第一回',
        scrollTop: 120,
        pairIndex: 3,
        excerpt: '第一段',
      })
      second = result.current.addPositionBookmark({
        chapterId: 1,
        chapterTitle: '第一回',
        scrollTop: 180,
        pairIndex: 3,
        excerpt: '重复段',
      })
    })

    expect(first?.created).toBe(true)
    expect(second?.created).toBe(false)
    expect(second?.mark.id).toBe(first?.mark.id)
    expect(result.current.positionBookmarks).toHaveLength(1)
  })
})
