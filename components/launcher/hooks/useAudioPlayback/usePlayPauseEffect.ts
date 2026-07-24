import { useEffect } from 'react'
import { safePlay } from '../../audio/safePlay'
import { shouldResumeAudioContext } from './helpers'
import type { AudioControllerOptions } from '../types'

type PlayPauseEffectOptions = Pick<
  AudioControllerOptions,
  'playback' | 'settings' | 'refs' | 'nativeHandoffActive' | 'initAudioContext'
> & {
  getActiveAudio: () => HTMLAudioElement | null
  reportPlayError: (error: unknown) => void
  isPlayingRef: React.MutableRefObject<boolean>
  playbackResumeNonce: number
}

export function usePlayPauseEffect({
  playback,
  settings,
  refs,
  nativeHandoffActive = false,
  initAudioContext,
  getActiveAudio,
  reportPlayError,
  isPlayingRef,
  playbackResumeNonce,
}: PlayPauseEffectOptions) {
  const { isPlaying, readyToPlay, userInteracted } = playback
  const { volume, isMuted } = settings
  const { audioRef, audioContextRef } = refs

  useEffect(() => {
    const activeAudio = getActiveAudio()
    if (!activeAudio) return

    const playAudio = async () => {
      if (!isPlayingRef.current) {
        return
      }

      const playbackTarget = getActiveAudio()
      if (!playbackTarget) {
        return
      }

      const primaryAudio = audioRef.current
      const shouldInitVisualizer =
        !nativeHandoffActive &&
        !audioContextRef.current &&
        primaryAudio &&
        primaryAudio.src &&
        playbackTarget === primaryAudio

      if (shouldInitVisualizer) {
        try {
          initAudioContext(primaryAudio)
          await new Promise(resolve => setTimeout(resolve, 50))

          const ctx = audioContextRef.current as AudioContext | null
          if (shouldResumeAudioContext(ctx)) {
            await ctx.resume()
          }
        } catch (err) {
          console.error('Failed to initialize AudioContext:', err)
        }
      }

      if (audioContextRef.current && !nativeHandoffActive) {
        if (shouldResumeAudioContext(audioContextRef.current)) {
          try {
            await audioContextRef.current.resume()
          } catch (err) {
            console.warn('AudioContext resume failed:', err)
          }
        }
      }

      playbackTarget.volume = isMuted ? 0 : volume
      playbackTarget.muted = isMuted

      try {
        await safePlay(playbackTarget)
      } catch (err) {
        reportPlayError(err)
      }
    }

    const canAutoPlay = readyToPlay || nativeHandoffActive

    if (isPlaying && canAutoPlay && userInteracted) {
      void playAudio()
    } else if (!isPlaying) {
      activeAudio.pause()
    }
  }, [
    isPlaying,
    userInteracted,
    readyToPlay,
    isMuted,
    volume,
    initAudioContext,
    reportPlayError,
    audioContextRef,
    audioRef,
    getActiveAudio,
    nativeHandoffActive,
    playbackResumeNonce,
    isPlayingRef,
  ])
}
