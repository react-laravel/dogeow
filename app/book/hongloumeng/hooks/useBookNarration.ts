'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { BookChapter, SentencePair } from '../utils/parseBook'
import type { ReaderContentMode } from './useReaderSettings'

export type BookNarrationStatus = 'idle' | 'playing' | 'paused'
export type BookNarrationMode = ReaderContentMode

interface UseBookNarrationOptions {
  chapter: BookChapter | null
  narrationMode: BookNarrationMode
  contentRef: RefObject<HTMLDivElement | null>
}

function getPairNarrationText(pair: SentencePair, narrationMode: BookNarrationMode): string {
  if (narrationMode === 'translation') return pair.t || pair.o
  if (narrationMode === 'both') return [pair.o, pair.t].filter(Boolean).join('。')
  return pair.o || pair.t
}

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null
  return window.speechSynthesis ?? null
}

export function useBookNarration({ chapter, narrationMode, contentRef }: UseBookNarrationOptions) {
  const [status, setStatus] = useState<BookNarrationStatus>('idle')
  const [activePairIndex, setActivePairIndex] = useState<number | null>(null)
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

    const text = getPairNarrationText(pair, narrationModeRef.current).trim()
    nextPairIndexRef.current = pairIndex + 1

    if (!text) {
      speakNextRef.current()
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.92
    utterance.pitch = 1
    utterance.volume = 1
    utterance.onend = () => {
      if (!stoppedRef.current) speakNextRef.current()
    }
    utterance.onerror = () => {
      stop()
    }

    utteranceRef.current = utterance
    setActivePairIndex(pairIndex)
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
    status,
    start,
    pause,
    resume,
    stop,
    supported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  }
}
