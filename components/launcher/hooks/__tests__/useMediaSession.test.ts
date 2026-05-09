import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useMediaSession } from '../useMediaSession'

type PlaybackState = 'none' | 'paused' | 'playing'

interface MockMediaSession {
  metadata: unknown
  playbackState: PlaybackState
  setActionHandler: ReturnType<typeof vi.fn>
}

const originalMediaSession = navigator.mediaSession
const originalMediaMetadata = globalThis.MediaMetadata
const hiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden')

describe('useMediaSession', () => {
  let isHidden = false
  let mediaSession: MockMediaSession

  beforeEach(() => {
    vi.useFakeTimers()

    isHidden = false
    mediaSession = {
      metadata: null,
      playbackState: 'none',
      setActionHandler: vi.fn(),
    }

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => isHidden,
    })

    Object.defineProperty(navigator, 'mediaSession', {
      configurable: true,
      value: mediaSession,
    })

    Object.defineProperty(globalThis, 'MediaMetadata', {
      configurable: true,
      value: class MockMediaMetadata {
        constructor(public readonly init: MediaMetadataInit) {}
      },
    })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()

    if (hiddenDescriptor) {
      Object.defineProperty(document, 'hidden', hiddenDescriptor)
    }

    Object.defineProperty(navigator, 'mediaSession', {
      configurable: true,
      value: originalMediaSession,
    })

    Object.defineProperty(globalThis, 'MediaMetadata', {
      configurable: true,
      value: originalMediaMetadata,
    })
  })

  it('pauses immediately when playback stops in the foreground', () => {
    const togglePlay = vi.fn()
    const switchToPrevTrack = vi.fn()
    const switchToNextTrack = vi.fn()

    const { rerender } = renderHook(
      ({ isPlaying }) =>
        useMediaSession({
          currentTrack: '/tracks/foo.mp3',
          availableTracks: [{ path: '/tracks/foo.mp3', name: 'Foo', duration: 120 }],
          isPlaying,
          togglePlay,
          switchToPrevTrack,
          switchToNextTrack,
        }),
      {
        initialProps: { isPlaying: true },
      }
    )

    expect(mediaSession.playbackState).toBe('playing')

    act(() => {
      rerender({ isPlaying: false })
    })

    expect(mediaSession.playbackState).toBe('paused')
  })

  it('does not briefly pause the lock-screen state during a hidden playback blip', () => {
    const togglePlay = vi.fn()
    const switchToPrevTrack = vi.fn()
    const switchToNextTrack = vi.fn()

    const { rerender } = renderHook(
      ({ isPlaying }) =>
        useMediaSession({
          currentTrack: '/tracks/foo.mp3',
          availableTracks: [{ path: '/tracks/foo.mp3', name: 'Foo', duration: 120 }],
          isPlaying,
          togglePlay,
          switchToPrevTrack,
          switchToNextTrack,
        }),
      {
        initialProps: { isPlaying: true },
      }
    )

    expect(mediaSession.playbackState).toBe('playing')

    act(() => {
      isHidden = true
      document.dispatchEvent(new Event('visibilitychange'))
      rerender({ isPlaying: false })
    })

    expect(mediaSession.playbackState).toBe('playing')

    act(() => {
      vi.advanceTimersByTime(750)
      rerender({ isPlaying: true })
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(mediaSession.playbackState).toBe('playing')
  })

  it('still pauses after the delay when playback really stops in the background', () => {
    const togglePlay = vi.fn()
    const switchToPrevTrack = vi.fn()
    const switchToNextTrack = vi.fn()

    const { rerender } = renderHook(
      ({ isPlaying }) =>
        useMediaSession({
          currentTrack: '/tracks/foo.mp3',
          availableTracks: [{ path: '/tracks/foo.mp3', name: 'Foo', duration: 120 }],
          isPlaying,
          togglePlay,
          switchToPrevTrack,
          switchToNextTrack,
        }),
      {
        initialProps: { isPlaying: true },
      }
    )

    act(() => {
      isHidden = true
      document.dispatchEvent(new Event('visibilitychange'))
      rerender({ isPlaying: false })
    })

    act(() => {
      vi.advanceTimersByTime(1499)
    })

    expect(mediaSession.playbackState).toBe('playing')

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(mediaSession.playbackState).toBe('paused')
  })
})
