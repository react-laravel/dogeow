import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { VolumeReaderSettings } from '@/app/book/types/reader'
import { BOOK_READER_PREFS_STORAGE_KEY, useBookSettings } from '../settings'

const defaults: VolumeReaderSettings = {
  originalFontFamily: 'yahei',
  translationFontFamily: 'yahei',
  fontSize: 20,
  lineHeight: 1.9,
  theme: 'sepia',
  pairDisplayMode: 'muted',
  contentMode: 'both',
  chapterId: '0-0',
}

describe('useBookSettings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shares appearance across books and keeps chapter progress per book', async () => {
    const first = renderHook(() =>
      useBookSettings({ storageKey: 'dogeow-book-reader:hongloumeng', defaults })
    )
    await act(async () => {})
    act(() => {
      first.result.current.patchSettings({ theme: 'dark', fontSize: 24, chapterId: '1-2' })
    })
    first.unmount()

    const second = renderHook(() =>
      useBookSettings({
        storageKey: 'dogeow-book-reader:biancheng',
        defaults: { ...defaults, chapterId: '0-0' },
      })
    )
    await act(async () => {})
    expect(second.result.current.settings.theme).toBe('dark')
    expect(second.result.current.settings.fontSize).toBe(24)
    expect(second.result.current.settings.chapterId).toBe('0-0')
    expect(JSON.parse(localStorage.getItem(BOOK_READER_PREFS_STORAGE_KEY) ?? '{}')).toMatchObject({
      theme: 'dark',
      fontSize: 24,
    })
    expect(JSON.parse(localStorage.getItem('dogeow-book-reader:hongloumeng') ?? '{}')).toEqual({
      chapterId: '1-2',
    })
  })

  it('migrates appearance from a legacy per-book blob once', async () => {
    localStorage.setItem(
      'dogeow-book-reader:luxun',
      JSON.stringify({ ...defaults, theme: 'green', chapterId: '2-0' })
    )

    const { result } = renderHook(() =>
      useBookSettings({ storageKey: 'dogeow-book-reader:luxun', defaults })
    )
    await act(async () => {})
    expect(result.current.settings.theme).toBe('green')
    expect(result.current.settings.chapterId).toBe('2-0')
    expect(JSON.parse(localStorage.getItem(BOOK_READER_PREFS_STORAGE_KEY) ?? '{}')).toMatchObject({
      theme: 'green',
    })
  })
})
