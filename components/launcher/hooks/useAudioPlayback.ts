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
  const { setCurrentTrack } = useMusicStore()

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
      audioRef.current.load()

      setAudioError(null)
      setIsTrackChanging(true)
    } catch (err) {
      console.error('setupMediaSource: failed to set audio source', err)
      setAudioError(`Failed to set audio source: ${err}`)
      toast.error('Failed to set audio source', { description: String(err) })
    }
  }, [currentTrack, buildAudioUrl, setAudioError, setIsTrackChanging, isMuted, volume, audioRef])

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
          if (ctx && ctx.state === 'suspended') {
            await ctx.resume()
          }

          if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = isMuted ? 0 : volume
          }

          if (audioRef.current) {
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
        if (audioContextRef.current.state === 'suspended') {
          try {
            await audioContextRef.current.resume()
          } catch (err) {
            console.warn('AudioContext resume failed:', err)
          }
        }

        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = isMuted ? 0 : volume
        }
      }

      if (audioRef.current) {
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
    gainNodeRef,
    audioContextRef,
    audioRef,
  ])

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return

    if (!availableTracks || availableTracks.length === 0) {
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

  // Sync volume
  useEffect(() => {
    const targetVolume = isMuted ? 0 : volume

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = targetVolume
    }

    if (audioRef.current) {
      if (gainNodeRef.current) {
        audioRef.current.volume = volume
        audioRef.current.muted = false
      } else {
        audioRef.current.volume = targetVolume
        audioRef.current.muted = isMuted
      }
    }
  }, [volume, isMuted, gainNodeRef, audioRef])

  // Listen for audio ended
  useEffect(() => {
    const audio = audioRef.current

    const handleAudioEnded = () => {
      setCurrentTime(0)
      switchTrack('next')
    }

    audio?.addEventListener('ended', handleAudioEnded)
    return () => audio?.removeEventListener('ended', handleAudioEnded)
  }, [setCurrentTime, switchTrack, audioRef])

  // Sync real playback state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => {
      const isDocumentHidden = typeof document !== 'undefined' && document.hidden
      if (
        shouldUpdatePlayingStateOnPause({
          isEnded: audio.ended,
          isDocumentHidden,
        })
      ) {
        setIsPlaying(false)
      }
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [setIsPlaying, audioRef])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!audioRef.current) return

      if (document.hidden) {
        wasPlayingBeforeHiddenRef.current = isPlaying || !audioRef.current.paused
        return
      }

      const shouldResumePlayback = wasPlayingBeforeHiddenRef.current || isPlaying
      if (!shouldResumePlayback) return

      wasPlayingBeforeHiddenRef.current = false

      try {
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume()
        }
        await audioRef.current.play()
      } catch (err) {
        console.warn('Failed to resume playback:', err)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isPlaying, audioContextRef, audioRef])

  // Toggle mute
  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)

    if (!audioRef.current) return

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = nextMuted ? 0 : volume
      audioRef.current.volume = volume
      audioRef.current.muted = false
      return
    }

    audioRef.current.volume = nextMuted ? 0 : volume
    audioRef.current.muted = nextMuted
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
