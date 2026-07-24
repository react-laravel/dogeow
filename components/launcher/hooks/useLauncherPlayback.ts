import { useMemo, useCallback } from 'react'
import { useMusicStore } from '@/stores/musicStore'
import { useMediaKeys } from './useMediaKeys'
import { useMediaSession } from './useMediaSession'
import { useTrackLyrics } from '../music/useTrackLyrics'
import type { useAudioManager } from '@/hooks/useAudioManager'

interface UseLauncherPlaybackOptions {
  audioManager: ReturnType<typeof useAudioManager>
}

export function useLauncherPlayback({ audioManager }: UseLauncherPlaybackOptions) {
  const { playMode } = useMusicStore()
  const {
    audioRef,
    isPlaying,
    availableTracks,
    currentTrack,
    currentTime,
    setIsPlaying,
    setCurrentTrack,
    setupMediaSource,
    resetCurrentTime,
    switchTrack,
    togglePlay,
    markUserInteracted,
  } = audioManager

  const switchToNextTrack = useCallback(() => {
    if (playMode === 'one') {
      resetCurrentTime()
      const audioElement = audioRef.current
      if (audioElement) {
        audioElement.play().catch(console.error)
      }
    } else {
      switchTrack('next')
    }
  }, [playMode, resetCurrentTime, audioRef, switchTrack])

  const switchToPrevTrack = useCallback(() => switchTrack('prev'), [switchTrack])

  const currentTrackInfo = useMemo(
    () => availableTracks.find(track => track.path === currentTrack),
    [availableTracks, currentTrack]
  )

  const handleFullscreenTrackPlay = useCallback(
    (trackPath: string) => {
      markUserInteracted()

      if (trackPath === currentTrack) {
        if (!audioRef.current?.src) {
          setupMediaSource()
          setIsPlaying(true)
          return
        }

        togglePlay()
        return
      }

      setCurrentTrack?.(trackPath)
      setIsPlaying(true)
    },
    [
      markUserInteracted,
      currentTrack,
      audioRef,
      setupMediaSource,
      setCurrentTrack,
      setIsPlaying,
      togglePlay,
    ]
  )

  const {
    currentLyric,
    lyrics,
    activeLyricIndex,
    status: lyricsStatus,
    hasLyrics,
  } = useTrackLyrics(currentTrack || '', currentTime, currentTrackInfo?.hasLyrics)

  useMediaKeys({ togglePlay, switchToPrevTrack, switchToNextTrack })

  useMediaSession({
    currentTrack,
    availableTracks,
    isPlaying,
    togglePlay,
    switchToPrevTrack,
    switchToNextTrack,
  })

  return {
    switchToNextTrack,
    switchToPrevTrack,
    handleFullscreenTrackPlay,
    currentLyric,
    lyrics,
    activeLyricIndex,
    lyricsStatus,
    hasLyrics,
  }
}
