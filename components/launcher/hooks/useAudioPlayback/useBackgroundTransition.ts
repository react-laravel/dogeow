import { useRef, useCallback } from 'react'
import { BACKGROUND_TRANSITION_GRACE_PERIOD_MS } from './helpers'

export function useBackgroundTransition() {
  const backgroundTransitionAtRef = useRef<number | null>(null)

  const markBackgroundTransition = useCallback(() => {
    backgroundTransitionAtRef.current = Date.now()
  }, [])

  const clearBackgroundTransition = useCallback(() => {
    backgroundTransitionAtRef.current = null
  }, [])

  const isDuringBackgroundTransition = useCallback(() => {
    const startedAt = backgroundTransitionAtRef.current
    return startedAt !== null && Date.now() - startedAt < BACKGROUND_TRANSITION_GRACE_PERIOD_MS
  }, [])

  return {
    markBackgroundTransition,
    clearBackgroundTransition,
    isDuringBackgroundTransition,
  }
}
