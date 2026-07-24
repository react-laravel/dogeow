import { useCallback, useEffect } from 'react'
import { shouldUpdatePlayingStateOnPause } from '../../audio/playbackStateUtils'
import type { AudioControllerOptions } from '../types'

type PlaybackEventListenersOptions = Pick<
  AudioControllerOptions,
  'refs' | 'callbacks' | 'handoffAudioRef' | 'nativeHandoffActive'
> & {
  clearBackgroundTransition: () => void
  isDuringBackgroundTransition: () => boolean
}

export function usePlaybackEventListeners({
  refs,
  callbacks,
  handoffAudioRef,
  nativeHandoffActive = false,
  clearBackgroundTransition,
  isDuringBackgroundTransition,
}: PlaybackEventListenersOptions) {
  const { audioRef } = refs
  const { setIsPlaying, setCurrentTime } = callbacks

  const bindPlaybackStateListeners = useCallback(
    (audio: HTMLAudioElement) => {
      const handlePlay = () => {
        clearBackgroundTransition()
        setIsPlaying(true)
      }
      const handlePause = () => {
        setTimeout(() => {
          const isDocumentHidden = typeof document !== 'undefined' && document.hidden
          if (
            shouldUpdatePlayingStateOnPause({
              isEnded: audio.ended,
              isDocumentHidden,
              isDuringBackgroundTransition: isDuringBackgroundTransition(),
            })
          ) {
            setIsPlaying(false)
          }
        }, 100)
      }

      audio.addEventListener('play', handlePlay)
      audio.addEventListener('pause', handlePause)

      return () => {
        audio.removeEventListener('play', handlePlay)
        audio.removeEventListener('pause', handlePause)
      }
    },
    [clearBackgroundTransition, isDuringBackgroundTransition, setIsPlaying]
  )

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    return bindPlaybackStateListeners(audio)
  }, [audioRef, bindPlaybackStateListeners])

  useEffect(() => {
    if (!nativeHandoffActive) return

    const handoffAudio = handoffAudioRef?.current
    if (!handoffAudio) return

    return bindPlaybackStateListeners(handoffAudio)
  }, [bindPlaybackStateListeners, handoffAudioRef, nativeHandoffActive])

  useEffect(() => {
    if (!nativeHandoffActive) return

    const handoffAudio = handoffAudioRef?.current
    if (!handoffAudio) return

    const handleTimeUpdate = () => {
      setCurrentTime(handoffAudio.currentTime)
    }

    handoffAudio.addEventListener('timeupdate', handleTimeUpdate)
    return () => {
      handoffAudio.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [handoffAudioRef, nativeHandoffActive, setCurrentTime])
}
