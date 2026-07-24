import { useCallback } from 'react'
import { useMusicStore } from '@/stores/musicStore'
import { toast } from 'sonner'
import { isAbortPlayError, safePlay } from '../../audio/safePlay'
import type { AudioControllerOptions } from '../types'

type PlaybackControlsOptions = Pick<
  AudioControllerOptions,
  | 'playback'
  | 'settings'
  | 'callbacks'
  | 'currentTrack'
  | 'availableTracks'
  | 'refs'
  | 'handoffAudioRef'
  | 'nativeHandoffActive'
  | 'initAudioContext'
> & {
  getActiveAudio: () => HTMLAudioElement | null
  setupMediaSource: () => void
}

export function usePlaybackControls({
  playback,
  settings,
  callbacks,
  currentTrack,
  availableTracks,
  refs,
  handoffAudioRef,
  nativeHandoffActive = false,
  initAudioContext,
  getActiveAudio,
  setupMediaSource,
}: PlaybackControlsOptions) {
  const { isPlaying, playMode } = playback
  const { volume, isMuted } = settings
  const { setIsPlaying, setCurrentTime, setDuration, setAudioError, setIsMuted } = callbacks
  const { audioRef, audioContextRef, gainNodeRef } = refs
  const { setCurrentTrack } = useMusicStore()

  const reportPlayError = useCallback(
    (error: unknown) => {
      if (isAbortPlayError(error)) {
        return
      }

      const message = error instanceof Error ? error.message : String(error)
      setAudioError(`Playback failed: ${message}`)
    },
    [setAudioError]
  )

  const togglePlay = useCallback(() => {
    const activeAudio = getActiveAudio()
    if (!activeAudio || !currentTrack) return

    const hasReadySource = Boolean(activeAudio.src || currentTrack)
    if ((!availableTracks || availableTracks.length === 0) && !hasReadySource) {
      setAudioError('Playlist is empty, no music to play')
      toast.error('Playlist is empty', { description: 'Please add music files to the playlist' })
      return
    }

    if (!nativeHandoffActive && audioRef.current && !audioRef.current.src) {
      setupMediaSource()
    }

    if (isPlaying) {
      activeAudio.pause()
      setIsPlaying(false)
      return
    }

    if (
      !nativeHandoffActive &&
      !audioContextRef.current &&
      audioRef.current?.src &&
      activeAudio === audioRef.current
    ) {
      initAudioContext(audioRef.current)
    }

    void safePlay(activeAudio).catch(reportPlayError)
    setIsPlaying(true)
  }, [
    currentTrack,
    isPlaying,
    setupMediaSource,
    setIsPlaying,
    setAudioError,
    reportPlayError,
    availableTracks,
    initAudioContext,
    audioContextRef,
    audioRef,
    getActiveAudio,
    nativeHandoffActive,
  ])

  const switchTrack = useCallback(
    (direction: 'next' | 'prev') => {
      if (!currentTrack || !availableTracks.length) {
        if (availableTracks.length === 0) {
          setAudioError('Playlist is empty, no music to play')
        }
        return
      }

      getActiveAudio()?.pause()
      handoffAudioRef?.current?.pause()

      const currentIndex = availableTracks.findIndex(track => track.path === currentTrack)
      let nextIndex = -1

      if (playMode === 'shuffle') {
        if (direction === 'next') {
          let randomIndex
          do {
            randomIndex = Math.floor(Math.random() * availableTracks.length)
          } while (randomIndex === currentIndex && availableTracks.length > 1)
          nextIndex = randomIndex
        } else {
          let randomIndex
          do {
            randomIndex = Math.floor(Math.random() * availableTracks.length)
          } while (randomIndex === currentIndex && availableTracks.length > 1)
          nextIndex = randomIndex
        }
      } else {
        if (direction === 'next') {
          nextIndex = (currentIndex + 1) % availableTracks.length
        } else {
          nextIndex = (currentIndex - 1 + availableTracks.length) % availableTracks.length
        }
      }

      setCurrentTrack(availableTracks[nextIndex].path)
      setAudioError(null)
      setIsPlaying(true)
    },
    [
      currentTrack,
      availableTracks,
      playMode,
      setCurrentTrack,
      setAudioError,
      setIsPlaying,
      getActiveAudio,
      handoffAudioRef,
    ]
  )

  const handleProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = parseFloat(e.target.value)
      setCurrentTime(newTime)
      const activeAudio = getActiveAudio()
      if (activeAudio) {
        activeAudio.currentTime = newTime
      }
    },
    [setCurrentTime, getActiveAudio]
  )

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)

    const activeAudio = getActiveAudio()
    if (!activeAudio) return

    activeAudio.volume = nextMuted ? 0 : volume
    activeAudio.muted = nextMuted
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = nextMuted ? 0 : 1
    }
  }, [isMuted, volume, setIsMuted, gainNodeRef, getActiveAudio])

  const resetCurrentTime = useCallback(() => {
    const activeAudio = getActiveAudio()
    if (activeAudio) {
      activeAudio.currentTime = 0
    }
  }, [getActiveAudio])

  const handleLoadedMetadata = useCallback(() => {
    if (!audioRef.current) return

    setDuration(audioRef.current.duration)
    setAudioError(null)

    if (isPlaying && audioRef.current.paused) {
      void safePlay(audioRef.current).catch(reportPlayError)
    }
  }, [isPlaying, setDuration, setAudioError, reportPlayError, audioRef])

  const handleAudioError = useCallback(
    (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
      const audio = e.currentTarget
      const errorCode = audio.error?.code ?? 'unknown'
      const errorMessage = audio.error?.message ?? 'Unknown error'

      setAudioError(`Playback error (${errorCode}): ${errorMessage}`)
      setIsPlaying(false)
    },
    [setAudioError, setIsPlaying]
  )

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }, [setCurrentTime, audioRef])

  return {
    reportPlayError,
    togglePlay,
    switchTrack,
    handleProgressChange,
    toggleMute,
    resetCurrentTime,
    handleLoadedMetadata,
    handleAudioError,
    handleTimeUpdate,
  }
}
