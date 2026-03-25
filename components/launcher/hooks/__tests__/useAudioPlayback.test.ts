import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioPlayback } from '../useAudioPlayback'

// Mock dependencies
vi.mock('@/stores/musicStore', () => ({
  useMusicStore: vi.fn(() => ({
    setCurrentTrack: vi.fn(),
  })),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('../audio/playbackStateUtils', () => ({
  shouldUpdatePlayingStateOnPause: vi.fn(() => true),
}))

describe('useAudioPlayback', () => {
  const mockOptions = {
    playback: {
      isPlaying: false,
      readyToPlay: true,
      userInteracted: true,
      isTrackChanging: false,
      playMode: 'none' as const,
    },
    settings: {
      volume: 0.8,
      isMuted: false,
    },
    callbacks: {
      setIsPlaying: vi.fn(),
      setCurrentTime: vi.fn(),
      setDuration: vi.fn(),
      setReadyToPlay: vi.fn(),
      setAudioError: vi.fn(),
      setIsTrackChanging: vi.fn(),
      setIsMuted: vi.fn(),
    },
    currentTrack: '/test/track.mp3',
    availableTracks: [{ path: '/test/track.mp3', name: 'Test Track' }],
    refs: {
      audioRef: { current: null as HTMLAudioElement | null },
      gainNodeRef: { current: null as GainNode | null },
      audioContextRef: { current: null as AudioContext | null },
    },
    buildAudioUrl: vi.fn((track: string) => `http://localhost:8000${track}`),
    initAudioContext: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Return Values', () => {
    it('should return audioRef', () => {
      const { result } = renderHook(() => useAudioPlayback(mockOptions))
      expect(result.current.audioRef).toBeDefined()
    })

    it('should return analyserNode as null initially', () => {
      const { result } = renderHook(() => useAudioPlayback(mockOptions))
      expect(result.current.analyserNode).toBeNull()
    })

    it('should return togglePlay function', () => {
      const { result } = renderHook(() => useAudioPlayback(mockOptions))
      expect(result.current.togglePlay).toBeDefined()
    })

    it('should return switchTrack function', () => {
      const { result } = renderHook(() => useAudioPlayback(mockOptions))
      expect(result.current.switchTrack).toBeDefined()
    })

    it('should return handleProgressChange function', () => {
      const { result } = renderHook(() => useAudioPlayback(mockOptions))
      expect(result.current.handleProgressChange).toBeDefined()
    })

    it('should return handleLoadedMetadata function', () => {
      const { result } = renderHook(() => useAudioPlayback(mockOptions))
      expect(result.current.handleLoadedMetadata).toBeDefined()
    })

    it('should return handleTimeUpdate function', () => {
      const { result } = renderHook(() => useAudioPlayback(mockOptions))
      expect(result.current.handleTimeUpdate).toBeDefined()
    })

    it('should return handleAudioError function', () => {
      const { result } = renderHook(() => useAudioPlayback(mockOptions))
      expect(result.current.handleAudioError).toBeDefined()
    })

    it('should return setupMediaSource function', () => {
      const { result } = renderHook(() => useAudioPlayback(mockOptions))
      expect(result.current.setupMediaSource).toBeDefined()
    })

    it('should return toggleMute function', () => {
      const { result } = renderHook(() => useAudioPlayback(mockOptions))
      expect(result.current.toggleMute).toBeDefined()
    })

    it('should return resetCurrentTime function', () => {
      const { result } = renderHook(() => useAudioPlayback(mockOptions))
      expect(result.current.resetCurrentTime).toBeDefined()
    })
  })
})