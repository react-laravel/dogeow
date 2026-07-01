'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { BookChapter, SentencePair } from '@/app/book/utils/bilingualParse'
import type { ReaderContentMode } from '@/app/book/types/reader'
import type { BookNarrationMode, BookNarrationStatus } from '@/app/book/types/narration'

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

  useEffect(() => {
    chapterRef.current = chapter
  }, [chapter])

  useEffect(() => {
    narrationModeRef.current = narrationMode
  }, [narrationMode])

  const scrollActivePairIntoView = useCallback(
    (pairIndex: number) => {
      const target = contentRef.current?.querySelector(`[data-pair-index="${pairIndex}"]`)
      target?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    },
    [contentRef]
  )

  const stop = useCallback(() => {
    const synth = getSpeechSynthesis()
    stoppedRef.current = true
    utteranceRef.current = null
    synth?.cancel()
    setStatus('idle')
    setActivePairIndex(null)
    setActiveHighlight(null)
  }, [])

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

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.92
    utterance.pitch = 1
    utterance.volume = 1
    utterance.onboundary = event => {
      const charIndex = event.charIndex
      const charLength =
        'charLength' in event && typeof event.charLength === 'number' && event.charLength > 0
          ? event.charLength
          : 1
      const segment =
        segments.find(item => charIndex >= item.start && charIndex < item.end) ??
        segments.find(item => charIndex < item.start) ??
        segments.at(-1)

      if (!segment) return

      const start = Math.max(0, Math.min(charIndex - segment.start, segment.text.length - 1))
      const end = Math.max(start + 1, Math.min(start + charLength, segment.text.length))
      setActiveHighlight({ pairIndex, role: segment.role, start, end })
    }
    utterance.onend = () => {
      if (!stoppedRef.current) speakNextRef.current()
    }
    utterance.onerror = () => {
      stop()
    }

    utteranceRef.current = utterance
    setActivePairIndex(pairIndex)
    setActiveHighlight(null)
    setStatus('playing')
    scrollActivePairIntoView(pairIndex)
    synth.speak(utterance)
  }, [scrollActivePairIntoView, stop])

  useEffect(() => {
    speakNextRef.current = speakNext
  }, [speakNext])

  const start = useCallback(
    (pairIndex = 0): boolean => {
      const synth = getSpeechSynthesis()
      const currentChapter = chapterRef.current
      if (!synth || !currentChapter || currentChapter.pairs.length === 0) return false

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
    synth.pause()
    setStatus('paused')
  }, [status])

  const resume = useCallback(() => {
    const synth = getSpeechSynthesis()
    if (!synth || status !== 'paused') return
    synth.resume()
    setStatus('playing')
  }, [status])

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
