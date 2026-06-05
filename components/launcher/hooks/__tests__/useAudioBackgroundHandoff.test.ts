import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAudioBackgroundHandoff } from '../useAudioBackgroundHandoff'

describe('useAudioBackgroundHandoff', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps handoff active when restoring visualizer audio fails', async () => {
    const setNativeHandoffActive = vi.fn()
    const setIsPlaying = vi.fn()
    const setCurrentTime = vi.fn()
    const setAudioMountKey = vi.fn()
    const teardownAudioContext = vi.fn(() => true)
    const initAudioContext = vi.fn()
    const routesPlaybackThroughWebAudio = vi.fn(() => true)

    const sourceAudio = document.createElement('audio')
    sourceAudio.src = 'https://example.com/track.mp3'
    sourceAudio.dataset.trackSrc = 'https://example.com/track.mp3'
    Object.defineProperty(sourceAudio, 'paused', { configurable: true, value: false })
    Object.defineProperty(sourceAudio, 'currentTime', { configurable: true, value: 12 })
    sourceAudio.pause = vi.fn()

    const handoffAudio = document.createElement('audio')
    handoffAudio.src = 'https://example.com/track.mp3'
    handoffAudio.dataset.trackSrc = 'https://example.com/track.mp3'
    Object.defineProperty(handoffAudio, 'currentTime', { configurable: true, value: 12 })
    handoffAudio.play = vi.fn(() => Promise.resolve()) as typeof handoffAudio.play
    handoffAudio.pause = vi.fn()
    Object.defineProperty(handoffAudio, 'paused', {
      configurable: true,
      get: () => false,
    })

    const audioRef = { current: sourceAudio }
    const handoffAudioRef = { current: handoffAudio }
    const audioContextRef = { current: null }

    renderHook(() =>
      useAudioBackgroundHandoff({
        audioRef,
        handoffAudioRef,
        setAudioMountKey,
        playbackMode: 'visualizer',
        isPlaying: true,
        setIsPlaying,
        setCurrentTime,
        setNativeHandoffActive,
        teardownAudioContext,
        initAudioContext,
        audioContextRef,
        routesPlaybackThroughWebAudio,
      })
    )

    Object.defineProperty(document, 'hidden', { configurable: true, value: true })

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(setNativeHandoffActive).toHaveBeenCalledWith(true)

    const restoredAudio = document.createElement('audio')
    restoredAudio.play = vi
      .fn()
      .mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'))
    audioRef.current = restoredAudio

    Object.defineProperty(document, 'hidden', { configurable: true, value: false })

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(handoffAudio.play).toHaveBeenCalled()
    expect(setNativeHandoffActive).not.toHaveBeenCalledWith(false)
  })
})
