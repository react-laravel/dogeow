'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { BookChapter, SentencePair } from '@/app/book/utils/bilingualParse'
import type { BookNarrationMode, BookNarrationStatus } from '@/app/book/types/narration'
import {
  scrollNarrationHighlightIntoView,
  scrollNarrationPairIntoView,
} from '@/app/book/utils/scroll'

export type { BookNarrationMode, BookNarrationStatus }
export interface BookNarrationHighlight {
  pairIndex: number
  role: 'original' | 'translation'
  start: number
  end: number
}

interface NarrationSegment {
  role: 'original' | 'translation'
  text: string
  start: number
  end: number
}

interface PendingResume {
  pairIndex: number
  startChar: number
  text: string
  segments: NarrationSegment[]
}

interface UseBookNarrationOptions {
  chapter: BookChapter | null
  narrationMode: BookNarrationMode
  contentRef: RefObject<HTMLDivElement | null>
}

/** Approximate Chinese TTS pace at rate 1.0 (chars / second). */
const BASE_CHARS_PER_SECOND = 4.2
const SPEECH_RATE = 0.92
const PROGRESS_INTERVAL_MS = 80
const HIGHLIGHT_WINDOW = 2

export function getPairNarrationParts(
  pair: SentencePair,
  narrationMode: BookNarrationMode
): { text: string; segments: NarrationSegment[] } {
  const fallbackRole = pair.o ? 'original' : 'translation'

  if (narrationMode === 'translation') {
    const text = pair.t || pair.o
    return {
      text,
      segments: text
        ? [{ role: pair.t ? 'translation' : fallbackRole, text, start: 0, end: text.length }]
        : [],
    }
  }

  if (narrationMode === 'both') {
    const segments: NarrationSegment[] = []
    let text = ''
    if (pair.o) {
      segments.push({ role: 'original', text: pair.o, start: 0, end: pair.o.length })
      text = pair.o
    }
    if (pair.t) {
      const separator = text ? '。' : ''
      const start = text.length + separator.length
      text = `${text}${separator}${pair.t}`
      segments.push({ role: 'translation', text: pair.t, start, end: start + pair.t.length })
    }
    return { text, segments }
  }

  const text = pair.o || pair.t
  return {
    text,
    segments: text
      ? [{ role: pair.o ? 'original' : fallbackRole, text, start: 0, end: text.length }]
      : [],
  }
}

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null
  return window.speechSynthesis ?? null
}

function pickChineseVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = synth.getVoices()
  if (voices.length === 0) return null

  const zhVoices = voices.filter(
    voice => /^(zh|cmn)/i.test(voice.lang) || /chinese|中文|普通话|国语|粤语/i.test(voice.name)
  )
  if (zhVoices.length === 0) return null

  return zhVoices.find(voice => voice.localService) ?? zhVoices[0] ?? null
}

function charIndexFromHighlight(
  highlight: BookNarrationHighlight | null,
  segments: NarrationSegment[]
): number {
  if (!highlight) return 0
  const segment = segments.find(item => item.role === highlight.role) ?? segments[0] ?? null
  return (segment?.start ?? 0) + highlight.start
}

function buildHighlightFromCharIndex(
  pairIndex: number,
  segments: NarrationSegment[],
  charIndex: number,
  charLength = HIGHLIGHT_WINDOW
): BookNarrationHighlight | null {
  const segment =
    segments.find(item => charIndex >= item.start && charIndex < item.end) ??
    segments.find(item => charIndex < item.start) ??
    segments.at(-1)

  if (!segment) return null

  const start = Math.max(0, Math.min(charIndex - segment.start, segment.text.length - 1))
  const end = Math.max(start + 1, Math.min(start + Math.max(charLength, 1), segment.text.length))
  return { pairIndex, role: segment.role, start, end }
}

export function useBookNarration({ chapter, narrationMode, contentRef }: UseBookNarrationOptions) {
  const [status, setStatus] = useState<BookNarrationStatus>('idle')
  const [activePairIndex, setActivePairIndex] = useState<number | null>(null)
  const [activeText, setActiveText] = useState('')
  const [activeHighlight, setActiveHighlight] = useState<BookNarrationHighlight | null>(null)
  const [rate, setRateState] = useState(1)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const nextPairIndexRef = useRef(0)
  const stoppedRef = useRef(true)
  const speakNextRef = useRef<() => void>(() => {})
  const chapterRef = useRef<BookChapter | null>(chapter)
  const narrationModeRef = useRef(narrationMode)
  const rateRef = useRef(1)
  const statusRef = useRef<BookNarrationStatus>('idle')
  const activePairIndexRef = useRef<number | null>(null)
  const activeHighlightRef = useRef<BookNarrationHighlight | null>(null)
  const activeFullTextRef = useRef('')
  const activeSegmentsRef = useRef<NarrationSegment[]>([])
  const pendingResumeRef = useRef<PendingResume | null>(null)
  const progressTimerRef = useRef<number | null>(null)
  const receivedBoundaryRef = useRef(false)
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    chapterRef.current = chapter
  }, [chapter])

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    activePairIndexRef.current = activePairIndex
  }, [activePairIndex])

  useEffect(() => {
    activeHighlightRef.current = activeHighlight
  }, [activeHighlight])

  useEffect(() => {
    narrationModeRef.current = narrationMode
  }, [narrationMode])

  useEffect(() => {
    const synth = getSpeechSynthesis()
    if (!synth) return

    const refreshVoice = () => {
      preferredVoiceRef.current = pickChineseVoice(synth)
    }

    refreshVoice()
    synth.addEventListener('voiceschanged', refreshVoice)
    return () => {
      synth.removeEventListener('voiceschanged', refreshVoice)
    }
  }, [])

  const clearProgressTimer = useCallback(() => {
    if (progressTimerRef.current != null) {
      window.clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
  }, [])

  const scrollActivePairIntoView = useCallback(
    (pairIndex: number) => {
      scrollNarrationPairIntoView(contentRef.current, pairIndex)
    },
    [contentRef]
  )

  const captureResume = useCallback((): PendingResume | null => {
    const pairIndex = activePairIndexRef.current
    const text = activeFullTextRef.current
    if (pairIndex == null || !text) return null
    return {
      pairIndex,
      startChar: charIndexFromHighlight(activeHighlightRef.current, activeSegmentsRef.current),
      text,
      segments: activeSegmentsRef.current,
    }
  }, [])

  const discardCurrentUtterance = useCallback(() => {
    clearProgressTimer()
    utteranceRef.current = null
    receivedBoundaryRef.current = false
    getSpeechSynthesis()?.cancel()
  }, [clearProgressTimer])

  const stop = useCallback(() => {
    stoppedRef.current = true
    pendingResumeRef.current = null
    discardCurrentUtterance()
    activeFullTextRef.current = ''
    activePairIndexRef.current = null
    activeHighlightRef.current = null
    statusRef.current = 'idle'
    setStatus('idle')
    setActivePairIndex(null)
    setActiveText('')
    setActiveHighlight(null)
  }, [discardCurrentUtterance])

  const speakNext = useCallback(() => {
    const synth = getSpeechSynthesis()
    const currentChapter = chapterRef.current
    if (!synth || !currentChapter || stoppedRef.current) {
      stop()
      return
    }

    const pendingResume = pendingResumeRef.current
    pendingResumeRef.current = null

    let pairIndex: number
    let text: string
    let segments: NarrationSegment[]
    let startChar = 0

    if (pendingResume) {
      pairIndex = pendingResume.pairIndex
      text = pendingResume.text
      segments = pendingResume.segments
      startChar = Math.max(0, Math.min(pendingResume.startChar, text.length))
    } else {
      pairIndex = nextPairIndexRef.current
      const pair = currentChapter.pairs[pairIndex]
      if (!pair) {
        stop()
        return
      }
      const parts = getPairNarrationParts(pair, narrationModeRef.current)
      text = parts.text
      segments = parts.segments
    }

    nextPairIndexRef.current = pairIndex + 1

    if (!text.trim() || startChar >= text.length) {
      speakNextRef.current()
      return
    }

    clearProgressTimer()
    receivedBoundaryRef.current = false

    const speakText = startChar > 0 ? text.slice(startChar) : text
    const utterance = new SpeechSynthesisUtterance(speakText)
    utterance.lang = 'zh-CN'
    utterance.rate = SPEECH_RATE * rateRef.current
    utterance.pitch = 1
    utterance.volume = 1
    if (preferredVoiceRef.current) {
      utterance.voice = preferredVoiceRef.current
    }

    const applyCharHighlight = (charIndex: number, charLength = HIGHLIGHT_WINDOW) => {
      const highlight = buildHighlightFromCharIndex(pairIndex, segments, charIndex, charLength)
      if (highlight) {
        activeHighlightRef.current = highlight
        setActiveHighlight(highlight)
      }
    }

    utterance.onboundary = event => {
      if (utteranceRef.current !== utterance) return
      if (event.name && event.name !== 'word' && event.name !== 'sentence') return

      receivedBoundaryRef.current = true
      clearProgressTimer()

      const charLength =
        'charLength' in event && typeof event.charLength === 'number' && event.charLength > 0
          ? event.charLength
          : HIGHLIGHT_WINDOW
      applyCharHighlight(startChar + event.charIndex, charLength)
    }

    utterance.onend = () => {
      if (utteranceRef.current !== utterance) return
      clearProgressTimer()
      if (!stoppedRef.current) speakNextRef.current()
    }
    utterance.onerror = event => {
      if (utteranceRef.current !== utterance) return
      const error = 'error' in event ? String(event.error) : ''
      if (error === 'interrupted' || error === 'canceled') return
      stop()
    }

    activeSegmentsRef.current = segments
    activeFullTextRef.current = text
    utteranceRef.current = utterance
    activePairIndexRef.current = pairIndex
    setActivePairIndex(pairIndex)
    setActiveText(text)
    applyCharHighlight(startChar, Math.min(HIGHLIGHT_WINDOW, text.length - startChar))
    statusRef.current = 'playing'
    setStatus('playing')
    scrollActivePairIntoView(pairIndex)

    const startedAt = performance.now()
    const charsPerSecond = BASE_CHARS_PER_SECOND * utterance.rate
    progressTimerRef.current = window.setInterval(() => {
      if (stoppedRef.current || utteranceRef.current !== utterance || receivedBoundaryRef.current) {
        clearProgressTimer()
        return
      }

      const elapsedSec = (performance.now() - startedAt) / 1000
      const charIndex = Math.min(
        startChar + Math.floor(elapsedSec * charsPerSecond),
        Math.max(text.length - 1, 0)
      )
      applyCharHighlight(charIndex)
    }, PROGRESS_INTERVAL_MS)

    synth.speak(utterance)
  }, [clearProgressTimer, scrollActivePairIntoView, stop])

  useEffect(() => {
    speakNextRef.current = speakNext
  }, [speakNext])

  useEffect(() => {
    if (!activeHighlight) return

    const frame = requestAnimationFrame(() => {
      scrollNarrationHighlightIntoView(contentRef.current, activeHighlight.pairIndex)
    })
    return () => cancelAnimationFrame(frame)
  }, [activeHighlight, contentRef])

  const start = useCallback(
    (pairIndex = 0): boolean => {
      const synth = getSpeechSynthesis()
      const currentChapter = chapterRef.current
      if (!synth || !currentChapter || currentChapter.pairs.length === 0) return false

      preferredVoiceRef.current = pickChineseVoice(synth) ?? preferredVoiceRef.current
      // 旧语句 cancel 的回调可能延迟到新语句开始后，先解除它的归属。
      pendingResumeRef.current = null
      utteranceRef.current = null
      synth.cancel()
      stoppedRef.current = false
      nextPairIndexRef.current = Math.max(0, Math.min(pairIndex, currentChapter.pairs.length - 1))
      speakNext()
      return true
    },
    [speakNext]
  )

  const replayFromCurrent = useCallback(() => {
    const snapshot = captureResume()
    if (!snapshot) return
    pendingResumeRef.current = snapshot
    stoppedRef.current = false
    discardCurrentUtterance()
    speakNext()
  }, [captureResume, discardCurrentUtterance, speakNext])

  const pause = useCallback(() => {
    if (statusRef.current !== 'playing') return
    const snapshot = captureResume()
    if (!snapshot) return
    pendingResumeRef.current = snapshot
    discardCurrentUtterance()
    statusRef.current = 'paused'
    setStatus('paused')
  }, [captureResume, discardCurrentUtterance])

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return
    stoppedRef.current = false
    if (!pendingResumeRef.current && activePairIndexRef.current != null) {
      nextPairIndexRef.current = activePairIndexRef.current
    }
    speakNext()
  }, [speakNext])

  const setRate = useCallback(
    (nextRate: number) => {
      const clamped = Math.max(0.5, Math.min(2, nextRate))
      const previous = rateRef.current
      rateRef.current = clamped
      setRateState(clamped)
      if (previous !== clamped && statusRef.current === 'playing') replayFromCurrent()
    },
    [replayFromCurrent]
  )

  useEffect(() => stop, [stop])

  useEffect(() => {
    queueMicrotask(stop)
  }, [chapter?.id, stop])

  return {
    activeText,
    activePairIndex,
    activeHighlight,
    status,
    rate,
    setRate,
    start,
    pause,
    resume,
    stop,
    supported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  }
}
