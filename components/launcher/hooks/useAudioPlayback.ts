/**
 * Audio playback control hook
 * Refactored to use Value Objects to reduce LongParameterList
 */
import { useRef, useCallback, useEffect, useState } from 'react'
import { useMusicStore } from '@/stores/musicStore'
import { toast } from 'sonner'
import { isAbortPlayError, safePlay } from '../audio/safePlay'
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
    suppressPrimaryAudio = false,
    handoffAudioRef,
    nativeHandoffActive = false,
    shouldDeferBackgroundResume,
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
  const isPlayingRef = useRef(isPlaying)
  const [playbackResumeNonce, setPlaybackResumeNonce] = useState(0)
  const { setCurrentTrack } = useMusicStore()

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  const getActiveAudio = useCallback((): HTMLAudioElement | null => {
    if (nativeHandoffActive && handoffAudioRef?.current?.src) {
      return handoffAudioRef.current
    }

    return audioRef.current
  }, [audioRef, handoffAudioRef, nativeHandoffActive])

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
    if (suppressPrimaryAudio) return
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
    suppressPrimaryAudio,
  ])

  // Listen for currentTrack changes
  useEffect(() => {
    if (suppressPrimaryAudio) return
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
  }, [currentTrack, buildAudioUrl, setupMediaSource, audioRef, suppressPrimaryAudio])

  // Handle play/pause
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
  ])

  // Toggle play/pause
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

  // Switch track
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

  // Handle progress change
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

  // Sync volume - 统一用 audio 元素控制音量
  useEffect(() => {
    const targetVolume = isMuted ? 0 : volume

    if (audioRef.current) {
      audioRef.current.volume = targetVolume
      audioRef.current.muted = isMuted
    }

    if (handoffAudioRef?.current) {
      handoffAudioRef.current.volume = targetVolume
      handoffAudioRef.current.muted = isMuted
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : 1
    }
  }, [volume, isMuted, audioRef, handoffAudioRef, gainNodeRef])

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

  // Sync real playback state
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

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const activeAudio = getActiveAudio()
      if (!activeAudio) return

      if (document.hidden) {
        markBackgroundTransition()
        wasPlayingBeforeHiddenRef.current = isPlaying && !activeAudio.paused
        return
      }

      if (shouldDeferBackgroundResume?.()) {
        return
      }

      if (wasPlayingBeforeHiddenRef.current && isPlaying && activeAudio.paused) {
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
  }, [getActiveAudio, isPlaying, markBackgroundTransition, shouldDeferBackgroundResume])

  // Toggle mute
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

  // Reset current time
  const resetCurrentTime = useCallback(() => {
    const activeAudio = getActiveAudio()
    if (activeAudio) {
      activeAudio.currentTime = 0
    }
  }, [getActiveAudio])

  // Handle loaded metadata
  const handleLoadedMetadata = useCallback(() => {
    if (!audioRef.current) return

    setDuration(audioRef.current.duration)
    setAudioError(null)

    if (isPlaying && audioRef.current.paused) {
      void safePlay(audioRef.current).catch(reportPlayError)
    }
  }, [isPlaying, setDuration, setAudioError, reportPlayError, audioRef])

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
