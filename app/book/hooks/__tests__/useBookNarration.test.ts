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
      rate = 1
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
  it('applies the chosen speed immediately by restarting the current paragraph', async () => {
    const contentRef = { current: null }
    const { result } = renderHook(() =>
      useBookNarration({ chapter, narrationMode: 'original', contentRef })
    )
    await act(async () => {})
    act(() => {
      result.current.start(0)
    })
    expect(spoken[0].rate).toBeCloseTo(0.92)
    act(() => {
      result.current.setRate(1.5)
    })
    expect(spoken).toHaveLength(2)
    expect(spoken[1].rate).toBeCloseTo(0.92 * 1.5)
    expect(spoken[1].text).toBe(chapter.pairs[0]?.o)
    expect(result.current.status).toBe('playing')
  })
  it('keeps the current place when speed changes mid-paragraph', async () => {
    const contentRef = { current: null }
    const { result } = renderHook(() =>
      useBookNarration({ chapter, narrationMode: 'original', contentRef })
    )
    await act(async () => {})
    act(() => {
      result.current.start(0)
    })
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.activeHighlight?.start).toBeGreaterThan(0)
    act(() => {
      result.current.setRate(1.25)
    })
    expect(
      spoken[1].text.startsWith('原文有一些文字。') || spoken[1].text.length < spoken[0].text.length
    ).toBe(true)
    expect(spoken[1].rate).toBeCloseTo(0.92 * 1.25)
  })
  it('uses the new speed when resuming after a pause', async () => {
    const contentRef = { current: null }
    const { result } = renderHook(() =>
      useBookNarration({ chapter, narrationMode: 'original', contentRef })
    )
    await act(async () => {})
    act(() => {
      result.current.start(0)
    })
    const first = spoken[0]
    act(() => {
      result.current.pause()
    })
    expect(result.current.status).toBe('paused')
    act(() => {
      first.onerror?.(
        Object.assign(new Event('error'), { error: 'interrupted' }) as SpeechSynthesisErrorEvent
      )
      first.onend?.(new Event('end') as SpeechSynthesisEvent)
    })
    expect(result.current.status).toBe('paused')
    act(() => {
      result.current.setRate(1.5)
    })
    expect(spoken).toHaveLength(1)
    act(() => {
      result.current.resume()
    })
    expect(result.current.status).toBe('playing')
    expect(spoken[1].rate).toBeCloseTo(0.92 * 1.5)
    expect(spoken[1].text).toBe(chapter.pairs[0]?.o)
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
