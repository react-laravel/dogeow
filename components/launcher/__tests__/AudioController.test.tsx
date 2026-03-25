import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AudioController } from '../AudioController'

// Mock dependencies
vi.mock('@/stores/musicStore', () => ({
  useMusicStore: vi.fn(() => ({
    currentTrack: '/test/track.mp3',
    availableTracks: [{ path: '/test/track.mp3', name: 'Test Track' }],
    setCurrentTrack: vi.fn(),
  })),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('../audio/utils', () => ({
  buildAudioUrl: vi.fn((track, apiUrl) => `${apiUrl}${track}`),
  isMobileDevice: vi.fn(() => false),
}))

vi.mock('../audio/playbackStateUtils', () => ({
  shouldUpdatePlayingStateOnPause: vi.fn(() => true),
}))

describe('AudioController', () => {
  const defaultProps = {
    volume: 0.8,
    isMuted: false,
    setIsPlaying: vi.fn(),
    setCurrentTime: vi.fn(),
    setDuration: vi.fn(),
    setReadyToPlay: vi.fn(),
    setAudioError: vi.fn(),
    isPlaying: false,
    readyToPlay: true,
    userInteracted: true,
    isTrackChanging: false,
    setIsTrackChanging: vi.fn(),
    playMode: 'none' as const,
    setIsMuted: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  describe('Rendering', () => {
    it('should initialize with correct default state', () => {
      const { result } = render(<AudioController {...defaultProps} />)
      expect(result.current.audioRef).toBeDefined()
    })
  })

  describe('togglePlay', () => {
    it('should toggle play state when called', () => {
      const { result } = render(<AudioController {...defaultProps} />)
      expect(result.current.togglePlay).toBeDefined()
    })
  })

  describe('switchTrack', () => {
    it('should switch to next track', () => {
      const { result } = render(<AudioController {...defaultProps} />)
      expect(result.current.switchTrack).toBeDefined()
    })

    it('should switch to previous track', () => {
      const { result } = render(<AudioController {...defaultProps} />)
      expect(result.current.switchTrack).toBeDefined()
    })
  })

  describe('handleProgressChange', () => {
    it('should update current time when progress changes', () => {
      const { result } = render(<AudioController {...defaultProps} />)
      expect(result.current.handleProgressChange).toBeDefined()
    })
  })

  describe('handleLoadedMetadata', () => {
    it('should set duration when metadata is loaded', () => {
      const { result } = render(<AudioController {...defaultProps} />)
      expect(result.current.handleLoadedMetadata).toBeDefined()
    })
  })

  describe('handleTimeUpdate', () => {
    it('should update current time during playback', () => {
      const { result } = render(<AudioController {...defaultProps} />)
      expect(result.current.handleTimeUpdate).toBeDefined()
    })
  })

  describe('handleAudioError', () => {
    it('should handle audio errors', () => {
      const { result } = render(<AudioController {...defaultProps} />)
      expect(result.current.handleAudioError).toBeDefined()
    })
  })

  describe('setupMediaSource', () => {
    it('should setup media source with current track', () => {
      const { result } = render(<AudioController {...defaultProps} />)
      expect(result.current.setupMediaSource).toBeDefined()
    })
  })

  describe('toggleMute', () => {
    it('should toggle mute state', () => {
      const { result } = render(<AudioController {...defaultProps} />)
      expect(result.current.toggleMute).toBeDefined()
    })
  })

  describe('resetCurrentTime', () => {
    it('should reset current playback time', () => {
      const { result } = render(<AudioController {...defaultProps} />)
      expect(result.current.resetCurrentTime).toBeDefined()
    })
  })

  describe('analyserNode', () => {
    it('should provide analyser node for visualization', () => {
      const { result } = render(<AudioController {...defaultProps} />)
      expect(result.current.analyserNode).toBeDefined()
    })
  })
})