'use client'

import { useCallback, useEffect, useState } from 'react'
import { parseAiNarrationVoice, type AiNarrationVoiceId } from '@/app/book/utils/aiNarration'

export const NARRATION_VOICE_STORAGE_KEY = 'dogeow-book-narration-voice'

export function useNarrationVoice(): {
  voice: AiNarrationVoiceId
  setVoice: (voice: AiNarrationVoiceId) => void
} {
  const [voice, setVoiceState] = useState<AiNarrationVoiceId>('serena')

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setVoiceState(parseAiNarrationVoice(localStorage.getItem(NARRATION_VOICE_STORAGE_KEY)))
      } catch {
        // ignore
      }
    })
  }, [])

  const setVoice = useCallback((next: AiNarrationVoiceId) => {
    setVoiceState(next)
    try {
      localStorage.setItem(NARRATION_VOICE_STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  return { voice, setVoice }
}
