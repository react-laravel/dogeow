import { useState, useEffect, useCallback, useRef } from 'react'
import { useMusicStore, MusicTrack } from '@/stores/musicStore'
import { useAudioPlayback } from '@/components/launcher/hooks/useAudioPlayback'
import { useAudioVisualizer } from '@/components/launcher/hooks/useAudioVisualizer'
import { apiRequest } from '@/lib/api'

export const useAudioManager = () => {
  const {
    currentTrack,
    volume: musicVolume,
    isPlaying: storeIsPlaying,
    playMode,
    setCurrentTrack,
    setAvailableTracks,
    setIsPlaying: setStoreIsPlaying,
    availableTracks,
  } = useMusicStore()

  // Local state
  const [isPlaying, setIsPlaying] = useState(storeIsPlaying)
  const [isMuted, setIsMuted] = useState(false)
  const [volume] = useState(musicVolume)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [userInteracted, setUserInteracted] = useState(false)
  const [isTrackChanging, setIsTrackChanging] = useState(false)
  const [readyToPlay, setReadyToPlay] = useState(false)
  const [isLoadingTracks, setIsLoadingTracks] = useState(false)

  // Audio refs
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

  // Build audio URL
  const buildAudioUrl = useCallback(
    (track: string) => {
      if (!track) return ''
      // Extract filename from path
      const filename = track.split('/').pop() ?? track
      return `${apiUrl}/musics/${filename}`
    },
    [apiUrl]
  )

  // Audio visualizer hook
  const visualizer = useAudioVisualizer({ volume, isMuted })

  // Initialize AudioContext from visualizer
  const initAudioContext = useCallback(
    (audioElement: HTMLAudioElement | null) => {
      visualizer.initAudioContext(audioElement)
      // Sync refs
      if (audioElement) {
        audioContextRef.current = visualizer.audioContextRef.current
      }
    },
    [visualizer]
  )

  // Audio playback hook with Value Objects
  const playback = useAudioPlayback({
    playback: {
      isPlaying,
      readyToPlay,
      userInteracted,
      isTrackChanging,
      playMode,
    },
    position: {
      currentTime,
      duration,
    },
    settings: {
      volume,
      isMuted,
    },
    callbacks: {
      setIsPlaying,
      setCurrentTime,
      setDuration,
      setReadyToPlay,
      setAudioError,
      setIsTrackChanging,
      setIsMuted,
    },
    currentTrack,
    availableTracks,
    refs: {
      audioRef,
      audioContextRef: visualizer.audioContextRef,
      analyserRef: visualizer.analyserRef,
      sourceRef: visualizer.sourceRef,
      gainNodeRef: visualizer.gainNodeRef,
    },
    buildAudioUrl,
    initAudioContext,
  })

  // Load audio list
  const fetchAvailableTracks = useCallback(async () => {
    setIsLoadingTracks(true)
    setAudioError(null)

    try {
      const musicData = await apiRequest<MusicTrack[]>('/musics')
      setAvailableTracks(musicData)

      // Check if playlist is empty
      if (musicData.length === 0) {
        setAudioError('Playlist is empty, no music to play')
        setCurrentTrack('')
        setIsPlaying(false)
        return
      }

      const currentTrackValue = useMusicStore.getState().currentTrack
      if (musicData.length > 0) {
        // If current track is empty, or current track is not in the new list, set first track
        if (!currentTrackValue || currentTrackValue === '') {
          setCurrentTrack(musicData[0].path)
        } else {
          // Check if current track is still valid
          const isValidTrack = musicData.some(track => track.path === currentTrackValue)
          if (!isValidTrack) {
            setCurrentTrack(musicData[0].path)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load audio list:', error)
      setAudioError('Failed to load audio list')
    } finally {
      setIsLoadingTracks(false)
    }
  }, [setAvailableTracks, setCurrentTrack, setAudioError, setIsPlaying])

  // Get current audio file name
  const getCurrentTrackName = useCallback(() => {
    if (!currentTrack) return ''

    const trackInfo = availableTracks.find(
      track => track.path === currentTrack || currentTrack.includes(track.path)
    )

    if (trackInfo?.name) {
      return trackInfo.name
    }

    // Extract filename from path
    const parts = currentTrack.split('/')
    const fileName = parts[parts.length - 1]
    let decodedFileName = fileName

    try {
      decodedFileName = decodeURIComponent(fileName)
    } catch {
      decodedFileName = fileName
    }

    return decodedFileName.replace(/\.(mp3|wav|m4a|aac|ogg|flac)$/i, '').replace(/[_\-]/g, ' ')
  }, [currentTrack, availableTracks])

  // Format time display
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }, [])

  // Sync playback state to store
  useEffect(() => {
    setStoreIsPlaying(isPlaying)
  }, [isPlaying, setStoreIsPlaying])

  // Listen for global user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true)
      }
    }

    const events = ['click', 'keydown', 'touchstart'] as const
    events.forEach(event => document.addEventListener(event, handleUserInteraction))

    return () => {
      events.forEach(event => document.removeEventListener(event, handleUserInteraction))
    }
  }, [userInteracted])

  const markUserInteracted = useCallback(() => {
    setUserInteracted(true)
  }, [])

  return {
    // State
    isPlaying,
    isMuted,
    volume,
    duration,
    currentTime,
    audioError,
    isLoadingTracks,
    currentTrack,
    availableTracks,
    readyToPlay,
    setReadyToPlay,
    setIsPlaying,
    // Methods
    getCurrentTrackName,
    formatTime,
    fetchAvailableTracks,
    setCurrentTrack,
    markUserInteracted,
    // Audio controller
    ...playback,
    analyserNode: visualizer.analyserNode,
  }
}
