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

class MockAudio {
  src = ''
  playbackRate = 1
  paused = true
  ended = false
  currentTime = 0
  duration = 10
  playsInline = false
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  ontimeupdate: (() => void) | null = null
  play = vi.fn(async () => {
    this.paused = false
    this.ended = false
  })
  pause = vi.fn(() => {
    this.paused = true
  })
  load = vi.fn()
  setAttribute = vi.fn()
  addEventListener(type: string, fn: () => void) {
    if (type === 'ended') this.onended = fn
    if (type === 'error') this.onerror = fn
    if (type === 'timeupdate') this.ontimeupdate = fn
  }
  removeEventListener(type: string, fn: () => void) {
    if (type === 'ended' && this.onended === fn) this.onended = null
    if (type === 'error' && this.onerror === fn) this.onerror = null
    if (type === 'timeupdate' && this.ontimeupdate === fn) this.ontimeupdate = null
  }
  removeAttribute = vi.fn((name: string) => {
    if (name === 'src') this.src = ''
  })
}

describe('AI audio narration', () => {
  const players: MockAudio[] = []

  beforeEach(() => {
    players.length = 0
    vi.stubGlobal(
      'Audio',
      class extends MockAudio {
        constructor() {
          super()
          players.push(this)
        }
      }
    )
  })

  it('plays catalogued audio and skips paragraphs without a file', async () => {
    const resolveAiAudioUrl = (pairIndex: number) =>
      pairIndex === 0 ? null : `https://cdn.example/00${pairIndex}.mp3`
    const { result } = renderHook(() =>
      useBookNarration({
        chapter,
        narrationMode: 'original',
        contentRef: { current: null },
        engine: 'ai',
        resolveAiAudioUrl,
      })
    )
    await act(async () => {})
    act(() => {
      result.current.start(0)
    })
    expect(spoken).toHaveLength(0)
    expect(players[0]?.src).toBe('https://cdn.example/001.mp3')
    expect(result.current.activePairIndex).toBe(1)
    expect(result.current.status).toBe('playing')
  })

  it('changes speed with playbackRate and keeps the same audio element', async () => {
    const { result } = renderHook(() =>
      useBookNarration({
        chapter,
        narrationMode: 'original',
        contentRef: { current: null },
        engine: 'ai',
        resolveAiAudioUrl: pairIndex => `https://cdn.example/${pairIndex}.mp3`,
      })
    )
    await act(async () => {})
    act(() => {
      result.current.start(0)
    })
    act(() => {
      result.current.setRate(1.5)
    })
    expect(players).toHaveLength(1)
    expect(players[0]?.playbackRate).toBe(1.5)
    expect(spoken).toHaveLength(0)
  })

  it('pauses and resumes the same AI audio without restarting', async () => {
    const { result } = renderHook(() =>
      useBookNarration({
        chapter,
        narrationMode: 'original',
        contentRef: { current: null },
        engine: 'ai',
        resolveAiAudioUrl: pairIndex => `https://cdn.example/${pairIndex}.mp3`,
      })
    )
    await act(async () => {})
    act(() => {
      result.current.start(0)
    })
    act(() => {
      result.current.pause()
    })
    expect(result.current.status).toBe('paused')
    expect(players[0]?.pause).toHaveBeenCalled()
    act(() => {
      result.current.resume()
    })
    expect(result.current.status).toBe('playing')
    expect(players[0]?.play).toHaveBeenCalledTimes(2)
    expect(players).toHaveLength(1)
  })

  it('continues to the next clip on the same audio element when a file ends', async () => {
    const { result } = renderHook(() =>
      useBookNarration({
        chapter,
        narrationMode: 'original',
        contentRef: { current: null },
        engine: 'ai',
        resolveAiAudioUrl: pairIndex => `https://cdn.example/${pairIndex}.mp3`,
      })
    )
    await act(async () => {})
    act(() => {
      result.current.start(0)
    })
    expect(players[0]?.src).toBe('https://cdn.example/0.mp3')
    act(() => {
      players[0]?.onended?.()
    })
    expect(players).toHaveLength(1)
    expect(players[0]?.src).toBe('https://cdn.example/1.mp3')
    expect(result.current.activePairIndex).toBe(1)
    expect(result.current.status).toBe('playing')
  })

  it('plays a short silence file for whitespace-only paragraphs', async () => {
    const blankChapter: BookChapter = {
      ...chapter,
      pairs: [
        { o: '  ', t: '' },
        { o: '正文。', t: '' },
      ],
    }
    const { result } = renderHook(() =>
      useBookNarration({
        chapter: blankChapter,
        narrationMode: 'original',
        contentRef: { current: null },
        engine: 'ai',
        resolveAiAudioUrl: pairIndex => `https://cdn.example/${pairIndex}.mp3`,
      })
    )
    await act(async () => {})
    act(() => {
      result.current.start(0)
    })
    expect(players[0]?.src).toBe('https://cdn.example/0.mp3')
    expect(result.current.activePairIndex).toBe(0)
    expect(result.current.status).toBe('playing')
  })

  it('returns false when the chapter has no AI audio', async () => {
    const { result } = renderHook(() =>
      useBookNarration({
        chapter,
        narrationMode: 'original',
        contentRef: { current: null },
        engine: 'ai',
        resolveAiAudioUrl: () => null,
      })
    )
    await act(async () => {})
    let started = true
    act(() => {
      started = result.current.start(0)
    })
    expect(started).toBe(false)
    expect(players).toHaveLength(0)
  })
})
