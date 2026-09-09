'use client'

import { useCallback, useEffect, useState } from 'react'
import type { BookNarrationEngine } from '@/app/book/types/narration'

export const NARRATION_ENGINE_STORAGE_KEY = 'dogeow-book-narration-engine'

export function parseNarrationEngine(value: unknown): BookNarrationEngine {
  return value === 'ai' ? 'ai' : 'tts'
}

export function useNarrationEngine(): {
  engine: BookNarrationEngine
  setEngine: (engine: BookNarrationEngine) => void
} {
  const [engine, setEngineState] = useState<BookNarrationEngine>('tts')

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setEngineState(parseNarrationEngine(localStorage.getItem(NARRATION_ENGINE_STORAGE_KEY)))
      } catch {
        // ignore
      }
    })
  }, [])

  const setEngine = useCallback((next: BookNarrationEngine) => {
    setEngineState(next)
    try {
      localStorage.setItem(NARRATION_ENGINE_STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  return { engine, setEngine }
}
