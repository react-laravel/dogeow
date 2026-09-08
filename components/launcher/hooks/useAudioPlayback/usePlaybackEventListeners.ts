import { useEffect } from 'react'
import { shouldUpdatePlayingStateOnPause } from '../../audio/playbackStateUtils'
import type { AudioControllerOptions } from '../types'

type PlaybackEventListenersOptions = Pick<AudioControllerOptions, 'refs' | 'callbacks'> & {
  sourceRevisionRef: React.MutableRefObject<number>
  isChangingSourceRef: React.MutableRefObject<boolean>
  clearBackgroundTransition: () => void
  isDuringBackgroundTransition: () => boolean
}

export function usePlaybackEventListeners({
  refs,
  callbacks,
  sourceRevisionRef,
  isChangingSourceRef,
  clearBackgroundTransition,
  isDuringBackgroundTransition,
}: PlaybackEventListenersOptions) {
  const { audioRef } = refs
  const { setIsPlaying, setIsTrackChanging } = callbacks

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    let pauseTimeout: ReturnType<typeof setTimeout> | undefined
    const clearPendingPause = () => {
      clearTimeout(pauseTimeout)
      pauseTimeout = undefined
    }
    const handlePlay = () => {
      clearPendingPause()
      clearBackgroundTransition()
      setIsPlaying(true)
    }
    const handlePlaying = () => {
      handlePlay()
      isChangingSourceRef.current = false
      setIsTrackChanging(false)
    }
    const handlePause = () => {
      clearPendingPause()
      // load() 和上一首结束也会派发 pause，不能把它们当成用户暂停新曲。
      if (!audio.paused || audio.ended || isChangingSourceRef.current) return
      const revision = sourceRevisionRef.current
      pauseTimeout = setTimeout(() => {
        if (revision !== sourceRevisionRef.current || isChangingSourceRef.current || !audio.paused)
          return
        if (
          shouldUpdatePlayingStateOnPause({
            isEnded: audio.ended,
            isDocumentHidden: document.hidden,
            isDuringBackgroundTransition: isDuringBackgroundTransition(),
          })
        )
          setIsPlaying(false)
      }, 100)
    }
    const handleError = () => {
      clearPendingPause()
      isChangingSourceRef.current = false
      setIsTrackChanging(false)
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('emptied', clearPendingPause)
    audio.addEventListener('error', handleError)
    return () => {
      clearPendingPause()
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('emptied', clearPendingPause)
      audio.removeEventListener('error', handleError)
    }
  }, [
    audioRef,
    sourceRevisionRef,
    isChangingSourceRef,
    clearBackgroundTransition,
    isDuringBackgroundTransition,
    setIsPlaying,
    setIsTrackChanging,
  ])
}
