import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAudioPlayback } from '../useAudioPlayback'
import type { AudioVisualizerSourceNode } from '../types'

const { setCurrentTrack } = vi.hoisted(() => ({
  setCurrentTrack: vi.fn(),
}))

vi.mock('@/stores/musicStore', () => ({
  useMusicStore: () => ({ setCurrentTrack }),
}))

describe('useAudioPlayback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lets the currentTrack effect load the next source exactly once', () => {
    const audio = document.createElement('audio')
    audio.pause = vi.fn()
    audio.load = vi.fn()
    audio.play = vi.fn(() => Promise.resolve())

    const setAudioError = vi.fn()
    const setIsPlaying = vi.fn()
    const audioRef = { current: audio }
    const existingSource = {} as AudioVisualizerSourceNode
    const sourceRef = { current: existingSource }
    const { result, rerender } = renderHook(
      ({ currentTrack }: { currentTrack: string }) =>
        useAudioPlayback({
          playback: {
            isPlaying: false,
            readyToPlay: false,
            userInteracted: true,
            isTrackChanging: false,
            playMode: 'all',
          },
          position: { currentTime: 0, duration: 0 },
          settings: { volume: 0.7, isMuted: false },
          callbacks: {
            setIsPlaying,
            setCurrentTime: vi.fn(),
            setDuration: vi.fn(),
            setReadyToPlay: vi.fn(),
            setAudioError,
            setIsTrackChanging: vi.fn(),
            setIsMuted: vi.fn(),
          },
          currentTrack,
          availableTracks: [
            { path: '/music/first.mp3', name: 'First', duration: 10 },
            { path: '/music/second.mp3', name: 'Second', duration: 10 },
          ],
          refs: {
            audioRef,
            audioContextRef: { current: null },
            analyserRef: { current: null },
            sourceRef,
            gainNodeRef: { current: null },
          },
          buildAudioUrl: track => `https://example.com${track}`,
          initAudioContext: vi.fn(),
        }),
      { initialProps: { currentTrack: '/music/first.mp3' } }
    )

    expect(audio.load).toHaveBeenCalledTimes(1)
    vi.mocked(audio.load).mockClear()

    act(() => {
      result.current.switchTrack('next')
    })

    expect(setCurrentTrack).toHaveBeenCalledWith('/music/second.mp3')
    expect(setAudioError).toHaveBeenLastCalledWith(null)
    expect(setIsPlaying).toHaveBeenLastCalledWith(true)
    expect(audio.load).not.toHaveBeenCalled()

    rerender({ currentTrack: '/music/second.mp3' })

    expect(audio.dataset.trackSrc).toBe('https://example.com/music/second.mp3')
    expect(audio.load).toHaveBeenCalledTimes(1)

    rerender({ currentTrack: '/music/second.mp3' })

    expect(audio.load).toHaveBeenCalledTimes(1)
    expect(sourceRef.current).toBe(existingSource)
  })
})
