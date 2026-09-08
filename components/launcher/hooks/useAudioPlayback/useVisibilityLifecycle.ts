import { useEffect, useRef } from 'react'
import type { AudioControllerOptions } from '../types'

type VisibilityLifecycleOptions = Pick<AudioControllerOptions, 'playback' | 'refs'> & {
  getActiveAudio: () => HTMLAudioElement | null
  markBackgroundTransition: () => void
  setPlaybackResumeNonce: React.Dispatch<React.SetStateAction<number>>
}

export function useVisibilityLifecycle({
  playback,
  refs,
  getActiveAudio,
  markBackgroundTransition,
  setPlaybackResumeNonce,
}: VisibilityLifecycleOptions) {
  const { isPlaying } = playback
  const { audioContextRef } = refs
  const wasPlayingBeforeHiddenRef = useRef(false)

  useEffect(() => {
    const handleVisibilityChange = () => {
      const activeAudio = getActiveAudio()
      if (!activeAudio) return

      if (document.hidden) {
        markBackgroundTransition()
        wasPlayingBeforeHiddenRef.current = isPlaying && !activeAudio.paused
        return
      }

      if (
        wasPlayingBeforeHiddenRef.current &&
        isPlaying &&
        (activeAudio.paused ||
          (audioContextRef.current && audioContextRef.current.state !== 'running'))
      ) {
        wasPlayingBeforeHiddenRef.current = false
        setPlaybackResumeNonce(nonce => nonce + 1)
      }
    }

    const handleWindowBlur = () => {
      markBackgroundTransition()
    }

    const handlePageHide = () => {
      markBackgroundTransition()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('pagehide', handlePageHide)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [getActiveAudio, isPlaying, markBackgroundTransition, audioContextRef, setPlaybackResumeNonce])
}
