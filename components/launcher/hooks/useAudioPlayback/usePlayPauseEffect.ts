import { useEffect } from 'react'
import { safePlay } from '../../audio/safePlay'
import { shouldResumeAudioContext } from './helpers'
import type { AudioControllerOptions } from '../types'

type PlayPauseEffectOptions = Pick<
  AudioControllerOptions,
  'playback' | 'settings' | 'refs' | 'currentTrack' | 'initAudioContext'
> & {
  reportPlayError: (error: unknown) => void
  isPlayingRef: React.MutableRefObject<boolean>
  sourceRevisionRef: React.MutableRefObject<number>
  playbackResumeNonce: number
}

export function usePlayPauseEffect({
  playback,
  settings,
  refs,
  currentTrack,
  initAudioContext,
  reportPlayError,
  isPlayingRef,
  sourceRevisionRef,
  playbackResumeNonce,
}: PlayPauseEffectOptions) {
  const { isPlaying, readyToPlay, userInteracted } = playback
  const { volume, isMuted } = settings
  const { audioRef, audioContextRef } = refs

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    let cancelled = false
    const revision = sourceRevisionRef.current
    const isCurrentRequest = () =>
      !cancelled &&
      isPlayingRef.current &&
      sourceRevisionRef.current === revision &&
      audioRef.current === audio

    const playAudio = async () => {
      if (!isCurrentRequest()) return
      if (!audioContextRef.current && audio.src) initAudioContext(audio)
      const context = audioContextRef.current
      if (shouldResumeAudioContext(context)) {
        try {
          await context.resume()
        } catch (err) {
          console.warn('AudioContext resume failed:', err)
        }
      }
      // 等待浏览器恢复期间，用户可能已暂停或切歌；旧请求不能重新开始播放。
      if (!isCurrentRequest()) return
      audio.volume = isMuted ? 0 : volume
      audio.muted = isMuted
      try {
        await safePlay(audio, isCurrentRequest)
      } catch (err) {
        if (isCurrentRequest()) reportPlayError(err)
      }
    }

    if (isPlaying && readyToPlay && userInteracted) void playAudio()
    else if (!isPlaying) audio.pause()

    return () => {
      cancelled = true
    }
  }, [
    isPlaying,
    userInteracted,
    readyToPlay,
    currentTrack,
    isMuted,
    volume,
    initAudioContext,
    reportPlayError,
    audioContextRef,
    audioRef,
    playbackResumeNonce,
    isPlayingRef,
    sourceRevisionRef,
  ])
}
