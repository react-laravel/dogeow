/**
 * Audio playback control hook
 * Refactored to use Value Objects to reduce LongParameterList
 */
import { useRef, useCallback, useEffect } from 'react'
import { useMusicStore } from '@/stores/musicStore'
import { toast } from 'sonner'
import { shouldUpdatePlayingStateOnPause } from '../audio/playbackStateUtils'
import type {
  AudioControllerOptions,
  AudioControllerResult,
  PlaybackState,
  AudioSettings,
  AudioRefs,
  AudioCallbacks,
} from './types'

// Re-export for backwards compatibility

function shouldResumeAudioContext(audioContext: AudioContext | null): audioContext is AudioContext {
  return Boolean(
    audioContext && audioContext.state !== 'running' && audioContext.state !== 'closed'
  )
}

const BACKGROUND_TRANSITION_GRACE_PERIOD_MS = 1500

export function useAudioPlayback(options: AudioControllerOptions): AudioControllerResult {
  const {
    playback,
    settings,
    callbacks,
    currentTrack,
    availableTracks,
    refs,
    buildAudioUrl,
    initAudioContext,
  } = options

  const { isPlaying, readyToPlay, userInteracted, isTrackChanging, playMode } = playback

  const { volume, isMuted } = settings
  const {
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setReadyToPlay,
    setAudioError,
    setIsTrackChanging,
    setIsMuted,
  } = callbacks

  const { audioRef, gainNodeRef, audioContextRef } = refs
  const wasPlayingBeforeHiddenRef = useRef(false)
  const backgroundTransitionAtRef = useRef<number | null>(null)
  const { setCurrentTrack } = useMusicStore()

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

  // Setup audio source
  const setupMediaSource = useCallback(() => {
    if (!audioRef.current || !currentTrack) return

    try {
      const audioUrl = buildAudioUrl(currentTrack)

      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.src = audioUrl

      try {
        if (audioRef.current.dataset) {
          audioRef.current.dataset.trackSrc = audioUrl
        }
      } catch {
        // ignore
      }

      audioRef.current.volume = isMuted ? 0 : volume
      audioRef.current.muted = isMuted
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = isMuted ? 0 : 1
      }
      audioRef.current.load()

      setAudioError(null)
      setIsTrackChanging(true)
      setReadyToPlay(false) // 重置加载状态，显示加载指示器
    } catch (err) {
      console.error('setupMediaSource: failed to set audio source', err)
      setAudioError(`Failed to set audio source: ${err}`)
      toast.error('Failed to set audio source', { description: String(err) })
    }
  }, [
    currentTrack,
    buildAudioUrl,
    setAudioError,
    setIsTrackChanging,
    setReadyToPlay,
    isMuted,
    volume,
    audioRef,
    gainNodeRef,
  ])

  // Listen for currentTrack changes
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return

    const desiredUrl = buildAudioUrl(currentTrack)
    let currentMarkedSrc: string | null = null

    try {
      currentMarkedSrc = audioRef.current.dataset?.trackSrc ?? null
    } catch {
      currentMarkedSrc = null
    }

    const currentElementSrc = audioRef.current.src
    const isSameByMark = currentMarkedSrc === desiredUrl
    const isSameByElement = !!currentElementSrc && currentElementSrc === desiredUrl

    if (!isSameByMark && !isSameByElement) {
      setupMediaSource()
    }
  }, [currentTrack, buildAudioUrl, setupMediaSource, audioRef])

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return

    const playAudio = async () => {
      if (!audioContextRef.current && audioRef.current && audioRef.current.src) {
        try {
          initAudioContext(audioRef.current)
          await new Promise(resolve => setTimeout(resolve, 50))

          const ctx = audioContextRef.current as AudioContext | null
          if (shouldResumeAudioContext(ctx)) {
            await ctx.resume()
          }

          // 音量由 audio 元素直接控制
          if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume
            audioRef.current.muted = isMuted
            await audioRef.current.play()
          }
        } catch (err) {
          console.error('Failed to initialize AudioContext:', err)
          if (audioRef.current) {
            audioRef.current.play().catch(handlePlayError)
          }
        }
        return
      }

      if (audioContextRef.current) {
        if (shouldResumeAudioContext(audioContextRef.current)) {
          try {
            await audioContextRef.current.resume()
          } catch (err) {
            console.warn('AudioContext resume failed:', err)
          }
        }
      }

      if (audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : volume
        audioRef.current.muted = isMuted
        audioRef.current.play().catch(handlePlayError)
      }
    }

    const handlePlayError = (err: Error) => {
      setAudioError(`Playback failed: ${err.message}`)
    }

    if (isPlaying && readyToPlay && userInteracted) {
      playAudio()
    } else if (!isPlaying) {
      audioRef.current.pause()
    }
  }, [
    isPlaying,
    userInteracted,
    readyToPlay,
    isMuted,
    volume,
    initAudioContext,
    setAudioError,
    audioContextRef,
    audioRef,
  ])

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return

    const hasReadySource = Boolean(audioRef.current.src || currentTrack)
    if ((!availableTracks || availableTracks.length === 0) && !hasReadySource) {
      setAudioError('Playlist is empty, no music to play')
      toast.error('Playlist is empty', { description: 'Please add music files to the playlist' })
      return
    }

    if (!audioRef.current.src) {
      setupMediaSource()
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      if (!audioContextRef.current && audioRef.current.src) {
        initAudioContext(audioRef.current)
      }
      audioRef.current.play().catch(err => setAudioError(`Playback failed: ${err.message}`))
      setIsPlaying(true)
    }
  }, [
    currentTrack,
    isPlaying,
    setupMediaSource,
    setIsPlaying,
    setAudioError,
    availableTracks,
    initAudioContext,
    audioContextRef,
    audioRef,
  ])

  // Switch track
  const switchTrack = useCallback(
    (direction: 'next' | 'prev') => {
      if (!currentTrack || !availableTracks.length) {
        if (availableTracks.length === 0) {
          setAudioError('Playlist is empty, no music to play')
        }
        return
      }

      audioRef.current?.pause()

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
      setupMediaSource()
    },
    [
      currentTrack,
      availableTracks,
      playMode,
      setCurrentTrack,
      setAudioError,
      setIsPlaying,
      setupMediaSource,
      audioRef,
    ]
  )

  // Handle progress change
  const handleProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = parseFloat(e.target.value)
      setCurrentTime(newTime)
      if (audioRef.current) {
        audioRef.current.currentTime = newTime
      }
    },
    [setCurrentTime, audioRef]
  )

  // Sync volume - 统一用 audio 元素控制音量
  useEffect(() => {
    const targetVolume = isMuted ? 0 : volume

    if (audioRef.current) {
      audioRef.current.volume = targetVolume
      audioRef.current.muted = isMuted
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : 1
    }
  }, [volume, isMuted, audioRef, gainNodeRef])

  // Sync real playback state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => {
      clearBackgroundTransition()
      setIsPlaying(true)
    }
    const handlePause = () => {
      // 延迟检查 document.hidden，避免与 visibilitychange 的竞态条件
      // 切换 app / 锁屏时，pause 事件可能在 visibilitychange 之前触发，
      // 此时 document.hidden 还是 false，会错误地将 isPlaying 设为 false
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
  }, [audioRef, clearBackgroundTransition, isDuringBackgroundTransition, setIsPlaying])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!audioRef.current) return

      // 页面隐藏时：记录当前播放状态
      if (document.hidden) {
        markBackgroundTransition()
        wasPlayingBeforeHiddenRef.current = isPlaying && !audioRef.current.paused
        return
      }

      // 页面重新可见时：只有在锁屏前确实在播放，且当前状态仍为播放时才恢复
      if (wasPlayingBeforeHiddenRef.current && isPlaying) {
        wasPlayingBeforeHiddenRef.current = false
        try {
          if (shouldResumeAudioContext(audioContextRef.current)) {
            await audioContextRef.current.resume()
          }
          // 只有在音频实际暂停状态时才尝试播放
          if (audioRef.current.paused) {
            await audioRef.current.play()
          }
        } catch (err) {
          console.warn('Failed to resume playback:', err)
        }
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
  }, [audioContextRef, audioRef, isPlaying, markBackgroundTransition])

  // Toggle mute
  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)

    if (!audioRef.current) return

    audioRef.current.volume = nextMuted ? 0 : volume
    audioRef.current.muted = nextMuted
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = nextMuted ? 0 : 1
    }
  }, [isMuted, volume, setIsMuted, audioRef, gainNodeRef])

  // Reset current time
  const resetCurrentTime = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }, [audioRef])

  // Handle loaded metadata
  const handleLoadedMetadata = useCallback(() => {
    if (!audioRef.current) return

    setDuration(audioRef.current.duration)
    setAudioError(null)

    if (isPlaying && audioRef.current.paused) {
      audioRef.current.play().catch(err => setAudioError(`Playback failed: ${err.message}`))
    }
  }, [isPlaying, setDuration, setAudioError, audioRef])

  // Handle audio error
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

  // Handle time update
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }, [setCurrentTime, audioRef])

  return {
    audioRef,
    analyserNode: null, // Set by useAudioVisualizer
    togglePlay,
    switchTrack,
    handleProgressChange,
    handleLoadedMetadata,
    handleTimeUpdate,
    handleAudioError,
    setupMediaSource,
    toggleMute,
    resetCurrentTime,
  }
}
