import { describe, expect, it } from 'vitest'
import { getPairNarrationParts } from '../useBookNarration'

describe('getPairNarrationParts', () => {
  const pair = { o: '原文一句', t: '译文一句' }

  it('uses original text in original mode', () => {
    const result = getPairNarrationParts(pair, 'original')
    expect(result.text).toBe('原文一句')
    expect(result.segments).toEqual([{ role: 'original', text: '原文一句', start: 0, end: 4 }])
  })

  it('uses translation text in translation mode', () => {
    const result = getPairNarrationParts(pair, 'translation')
    expect(result.text).toBe('译文一句')
    expect(result.segments[0]?.role).toBe('translation')
  })

  it('concatenates both with separator in both mode', () => {
    const result = getPairNarrationParts(pair, 'both')
    expect(result.text).toBe('原文一句。译文一句')
    expect(result.segments).toHaveLength(2)
    expect(result.segments[1]?.start).toBe('原文一句。'.length)
  })
})

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { useBookNarration } from '../useBookNarration'
import type { BookChapter } from '@/app/book/utils/bilingualParse'

const chapter: BookChapter = {
  id: 1,
  title: '测试章',
  translationTitle: '',
  pairs: [
    { o: '第一段原文有一些文字。', t: '第一段译文内容。' },
    { o: '第二段原文。', t: '第二段译文。' },
  ],
}
let spoken: SpeechSynthesisUtterance[]
beforeEach(() => {
  vi.useFakeTimers()
  spoken = []
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      text: string
      constructor(text: string) {
        this.text = text
      }
    }
  )
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => [],
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    speak: (utterance: SpeechSynthesisUtterance) => spoken.push(utterance),
  })
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('narration controls', () => {
  it('uses the chosen speed on the next paragraph without restarting the current one', async () => {
    const contentRef = { current: null }
    const { result, rerender } = renderHook(
      ({ rate }) => useBookNarration({ chapter, narrationMode: 'original', contentRef, rate }),
      { initialProps: { rate: 1 } }
    )
    await act(async () => {})
    act(() => {
      result.current.start(0)
    })
    const first = spoken[0]
    rerender({ rate: 1.5 })
    expect(spoken).toHaveLength(1)
    expect(first.rate).toBeCloseTo(0.92)
    act(() => {
      first.onend?.(new Event('end') as SpeechSynthesisEvent)
    })
    expect(spoken[1].rate).toBeCloseTo(0.92 * 1.5)
  })
  it('ignores cancellation events from a paragraph replaced by a seek', async () => {
    const { result } = renderHook(() =>
      useBookNarration({ chapter, narrationMode: 'original', contentRef: { current: null } })
    )
    await act(async () => {})
    act(() => {
      result.current.start(0)
    })
    const first = spoken[0]
    act(() => {
      result.current.start(1)
    })
    act(() => {
      first.onerror?.(new Event('error') as SpeechSynthesisErrorEvent)
      first.onend?.(new Event('end') as SpeechSynthesisEvent)
    })
    expect(result.current.status).toBe('playing')
    expect(result.current.activePairIndex).toBe(1)
    expect(spoken).toHaveLength(2)
  })
  it('keeps highlighting the spoken text when content mode changes while paused', async () => {
    const contentRef = { current: null }
    const { result, rerender } = renderHook(
      ({ mode }: { mode: 'original' | 'translation' }) =>
        useBookNarration({ chapter, narrationMode: mode, contentRef }),
      { initialProps: { mode: 'original' } }
    )
    await act(async () => {})
    act(() => {
      result.current.start(0)
    })
    act(() => {
      result.current.pause()
    })
    rerender({ mode: 'translation' })
    act(() => {
      result.current.resume()
      vi.advanceTimersByTime(400)
    })
    expect(result.current.activeHighlight?.role).toBe('original')
  })
})
