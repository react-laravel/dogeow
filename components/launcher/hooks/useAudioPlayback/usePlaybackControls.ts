import { useCallback } from 'react'
import { useMusicStore } from '@/stores/musicStore'
import { isAbortPlayError, safePlay } from '../../audio/safePlay'
import { shouldResumeAudioContext } from './helpers'
import type { AudioControllerOptions } from '../types'

type PlaybackControlsOptions = Pick<
  AudioControllerOptions,
  | 'playback'
  | 'settings'
  | 'callbacks'
  | 'currentTrack'
  | 'availableTracks'
  | 'refs'
  | 'initAudioContext'
> & {
  getActiveAudio: () => HTMLAudioElement | null
  setupMediaSource: (track?: string) => boolean
  sourceRevisionRef: React.MutableRefObject<number>
  isPlayingRef: React.MutableRefObject<boolean>
}

export function usePlaybackControls({
  playback,
  settings,
  callbacks,
  currentTrack,
  availableTracks,
  refs,
  initAudioContext,
  getActiveAudio,
  setupMediaSource,
  sourceRevisionRef,
  isPlayingRef,
}: PlaybackControlsOptions) {
  const { isPlaying, playMode } = playback
  const { volume, isMuted } = settings
  const { setIsPlaying, setCurrentTime, setDuration, setAudioError, setIsMuted } = callbacks
  const { audioRef, audioContextRef, gainNodeRef } = refs
  const { setCurrentTrack } = useMusicStore()

  const reportPlayError = useCallback(
    (error: unknown) => {
      if (isAbortPlayError(error)) return
      const message = error instanceof Error ? error.message : String(error)
      setAudioError(`Playback failed: ${message}`)
      isPlayingRef.current = false
      setIsPlaying(false)
    },
    [setAudioError, setIsPlaying, isPlayingRef]
  )

  const startPlayback = useCallback(
    (audio: HTMLAudioElement) => {
      isPlayingRef.current = true
      setIsPlaying(true)
      if (!audioContextRef.current) initAudioContext(audio)
      const context = audioContextRef.current
      if (shouldResumeAudioContext(context)) void context.resume().catch(() => {})
      const revision = sourceRevisionRef.current
      const isCurrentRequest = () => isPlayingRef.current && sourceRevisionRef.current === revision
      // 在点击或 ended 事件内立即向同一元素发出播放请求，不等 React 的下一次 effect。
      void safePlay(audio, isCurrentRequest).catch(error => {
        if (isCurrentRequest()) reportPlayError(error)
      })
    },
    [
      setIsPlaying,
      isPlayingRef,
      audioContextRef,
      initAudioContext,
      sourceRevisionRef,
      reportPlayError,
    ]
  )

  const togglePlay = useCallback(() => {
    const audio = getActiveAudio()
    if (!audio || !currentTrack) return
    if (isPlaying) {
      isPlayingRef.current = false
      audio.pause()
      setIsPlaying(false)
      return
    }
    if (!setupMediaSource()) return
    startPlayback(audio)
  }, [
    currentTrack,
    isPlaying,
    setupMediaSource,
    setIsPlaying,
    isPlayingRef,
    getActiveAudio,
    startPlayback,
  ])

  const switchTrack = useCallback(
    (direction: 'next' | 'prev') => {
      const audio = getActiveAudio()
      if (!audio || !currentTrack || !availableTracks.length) return
      const currentIndex = availableTracks.findIndex(track => track.path === currentTrack)
      let nextIndex: number
      if (playMode === 'shuffle' && availableTracks.length > 1) {
        const otherTracks = availableTracks
          .map((_, index) => index)
          .filter(index => index !== currentIndex)
        nextIndex = otherTracks[Math.floor(Math.random() * otherTracks.length)]
      } else {
        nextIndex =
          (currentIndex + (direction === 'next' ? 1 : availableTracks.length - 1)) %
          availableTracks.length
      }
      const nextTrack = availableTracks[nextIndex].path
      if (!setupMediaSource(nextTrack)) return
      if (nextTrack === currentTrack) {
        audio.currentTime = 0
        setCurrentTime(0)
      }
      setCurrentTrack(nextTrack)
      setAudioError(null)
      startPlayback(audio)
    },
    [
      currentTrack,
      availableTracks,
      playMode,
      setCurrentTrack,
      setCurrentTime,
      setAudioError,
      getActiveAudio,
      setupMediaSource,
      startPlayback,
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

    if (Number.isFinite(audioRef.current.duration)) setDuration(audioRef.current.duration)
    setAudioError(null)
  }, [setDuration, setAudioError, audioRef])

  const handleAudioError = useCallback(
    (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
      const audio = e.currentTarget
      const errorCode = audio.error?.code ?? 'unknown'
      const errorMessage = audio.error?.message ?? 'Unknown error'

      setAudioError(`Playback error (${errorCode}): ${errorMessage}`)
      isPlayingRef.current = false
      setIsPlaying(false)
    },
    [setAudioError, setIsPlaying, isPlayingRef]
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
