'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { BookChapter, SentencePair } from '@/app/book/utils/bilingualParse'
import type { BookNarrationMode, BookNarrationStatus } from '@/app/book/types/narration'
import { scrollNarrationPairIntoView } from '@/app/book/utils/scroll'

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

function getPairNarrationParts(
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
  const [activeHighlight, setActiveHighlight] = useState<BookNarrationHighlight | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const nextPairIndexRef = useRef(0)
  const stoppedRef = useRef(true)
  const speakNextRef = useRef<() => void>(() => {})
  const chapterRef = useRef<BookChapter | null>(chapter)
  const narrationModeRef = useRef(narrationMode)
  const progressTimerRef = useRef<number | null>(null)
  const receivedBoundaryRef = useRef(false)
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    chapterRef.current = chapter
  }, [chapter])

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

  const stop = useCallback(() => {
    const synth = getSpeechSynthesis()
    stoppedRef.current = true
    clearProgressTimer()
    utteranceRef.current = null
    receivedBoundaryRef.current = false
    synth?.cancel()
    setStatus('idle')
    setActivePairIndex(null)
    setActiveHighlight(null)
  }, [clearProgressTimer])

  const speakNext = useCallback(() => {
    const synth = getSpeechSynthesis()
    const currentChapter = chapterRef.current
    if (!synth || !currentChapter || stoppedRef.current) {
      stop()
      return
    }

    const pairIndex = nextPairIndexRef.current
    const pair = currentChapter.pairs[pairIndex]
    if (!pair) {
      stop()
      return
    }

    const { text, segments } = getPairNarrationParts(pair, narrationModeRef.current)
    nextPairIndexRef.current = pairIndex + 1

    if (!text.trim()) {
      speakNextRef.current()
      return
    }

    clearProgressTimer()
    receivedBoundaryRef.current = false

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = SPEECH_RATE
    utterance.pitch = 1
    utterance.volume = 1
    if (preferredVoiceRef.current) {
      utterance.voice = preferredVoiceRef.current
    }

    const applyCharHighlight = (charIndex: number, charLength = HIGHLIGHT_WINDOW) => {
      const highlight = buildHighlightFromCharIndex(pairIndex, segments, charIndex, charLength)
      if (highlight) setActiveHighlight(highlight)
    }

    utterance.onboundary = event => {
      if (event.name && event.name !== 'word' && event.name !== 'sentence') return

      receivedBoundaryRef.current = true
      clearProgressTimer()

      const charIndex = event.charIndex
      const charLength =
        'charLength' in event && typeof event.charLength === 'number' && event.charLength > 0
          ? event.charLength
          : HIGHLIGHT_WINDOW
      applyCharHighlight(charIndex, charLength)
    }

    utterance.onend = () => {
      clearProgressTimer()
      if (!stoppedRef.current) speakNextRef.current()
    }
    utterance.onerror = () => {
      stop()
    }

    utteranceRef.current = utterance
    setActivePairIndex(pairIndex)
    applyCharHighlight(0, Math.min(HIGHLIGHT_WINDOW, text.length))
    setStatus('playing')
    scrollActivePairIntoView(pairIndex)

    const startedAt = performance.now()
    const charsPerSecond = BASE_CHARS_PER_SECOND * SPEECH_RATE
    progressTimerRef.current = window.setInterval(() => {
      if (stoppedRef.current || utteranceRef.current !== utterance || receivedBoundaryRef.current) {
        clearProgressTimer()
        return
      }

      const elapsedSec = (performance.now() - startedAt) / 1000
      const charIndex = Math.min(
        Math.floor(elapsedSec * charsPerSecond),
        Math.max(text.length - 1, 0)
      )
      applyCharHighlight(charIndex)
    }, PROGRESS_INTERVAL_MS)

    synth.speak(utterance)
  }, [clearProgressTimer, scrollActivePairIntoView, stop])

  useEffect(() => {
    speakNextRef.current = speakNext
  }, [speakNext])

  const start = useCallback(
    (pairIndex = 0): boolean => {
      const synth = getSpeechSynthesis()
      const currentChapter = chapterRef.current
      if (!synth || !currentChapter || currentChapter.pairs.length === 0) return false

      preferredVoiceRef.current = pickChineseVoice(synth) ?? preferredVoiceRef.current
      synth.cancel()
      stoppedRef.current = false
      nextPairIndexRef.current = Math.max(0, Math.min(pairIndex, currentChapter.pairs.length - 1))
      speakNext()
      return true
    },
    [speakNext]
  )

  const pause = useCallback(() => {
    const synth = getSpeechSynthesis()
    if (!synth || status !== 'playing') return
    clearProgressTimer()
    synth.pause()
    setStatus('paused')
  }, [clearProgressTimer, status])

  const resume = useCallback(() => {
    const synth = getSpeechSynthesis()
    if (!synth || status !== 'paused') return

    const utterance = utteranceRef.current
    const highlight = activeHighlight
    synth.resume()
    setStatus('playing')

    // Network voices often skip boundary events; keep estimating after resume.
    if (!utterance || receivedBoundaryRef.current || !highlight) return

    const pair = chapterRef.current?.pairs[highlight.pairIndex]
    if (!pair) return

    const { text, segments } = getPairNarrationParts(pair, narrationModeRef.current)
    if (!text) return

    const resumedAt = performance.now()
    const charsPerSecond = BASE_CHARS_PER_SECOND * SPEECH_RATE
    const activeSegment =
      segments.find(segment => segment.role === highlight.role) ?? segments[0] ?? null
    const resumeOffset = (activeSegment?.start ?? 0) + highlight.start

    progressTimerRef.current = window.setInterval(() => {
      if (stoppedRef.current || utteranceRef.current !== utterance || receivedBoundaryRef.current) {
        clearProgressTimer()
        return
      }

      const elapsedSec = (performance.now() - resumedAt) / 1000
      const charIndex = Math.min(
        Math.floor(resumeOffset + elapsedSec * charsPerSecond),
        Math.max(text.length - 1, 0)
      )
      const next = buildHighlightFromCharIndex(
        highlight.pairIndex,
        segments,
        charIndex,
        HIGHLIGHT_WINDOW
      )
      if (next) setActiveHighlight(next)
    }, PROGRESS_INTERVAL_MS)
  }, [activeHighlight, clearProgressTimer, status])

  useEffect(() => stop, [stop])

  useEffect(() => {
    queueMicrotask(stop)
  }, [chapter?.id, stop])

  return {
    activePairIndex,
    activeHighlight,
    status,
    start,
    pause,
    resume,
    stop,
    supported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  }
}
