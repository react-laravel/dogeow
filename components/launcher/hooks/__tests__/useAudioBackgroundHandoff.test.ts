import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAudioBackgroundHandoff } from '../useAudioBackgroundHandoff'

describe('useAudioBackgroundHandoff', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not touch either player or the graph when background handoff is unnecessary', async () => {
    const audio = document.createElement('audio')
    audio.src = 'https://example.com/music.mp3'
    audio.currentTime = 12
    audio.pause = vi.fn()
    audio.load = vi.fn()
    const handoff = document.createElement('audio')
    handoff.play = vi.fn()
    handoff.load = vi.fn()
    const teardownAudioContext = vi.fn()
    const initAudioContext = vi.fn()
    const setAudioMountKey = vi.fn()
    renderHook(() =>
      useAudioBackgroundHandoff({
        audioRef: { current: audio },
        handoffAudioRef: { current: handoff },
        setAudioMountKey,
        playbackMode: 'visualizer',
        isPlaying: true,
        setIsPlaying: vi.fn(),
        setCurrentTime: vi.fn(),
        setNativeHandoffActive: vi.fn(),
        teardownAudioContext,
        initAudioContext,
        audioContextRef: { current: null },
        requiresBackgroundHandoff: () => false,
      })
    )
    for (const hidden of [true, false, true, false]) {
      vi.spyOn(document, 'hidden', 'get').mockReturnValue(hidden)
      await act(async () => {
        document.dispatchEvent(new Event('visibilitychange'))
      })
    }
    expect(audio.currentTime).toBe(12)
    expect(audio.pause).not.toHaveBeenCalled()
    expect(audio.load).not.toHaveBeenCalled()
    expect(handoff.play).not.toHaveBeenCalled()
    expect(handoff.load).not.toHaveBeenCalled()
    expect(teardownAudioContext).not.toHaveBeenCalled()
    expect(initAudioContext).not.toHaveBeenCalled()
    expect(setAudioMountKey).not.toHaveBeenCalled()
  })

  it('keeps handoff active when restoring visualizer audio fails', async () => {
    const setNativeHandoffActive = vi.fn()
    const setIsPlaying = vi.fn()
    const setCurrentTime = vi.fn()
    const setAudioMountKey = vi.fn()
    const requiresBackgroundHandoff = vi.fn(() => true)
    const teardownAudioContext = vi.fn(() => {
      requiresBackgroundHandoff.mockReturnValue(false)
      return true
    })
    const initAudioContext = vi.fn()

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
        requiresBackgroundHandoff,
      })
    )

    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(setNativeHandoffActive).toHaveBeenCalledWith(true)

    const restoredAudio = document.createElement('audio')
    restoredAudio.src = sourceAudio.src
    restoredAudio.play = vi
      .fn()
      .mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'))
    audioRef.current = restoredAudio

    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
      await Promise.resolve()
      await Promise.resolve()
      restoredAudio.dispatchEvent(new Event('canplay'))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(handoffAudio.play).toHaveBeenCalled()
    expect(restoredAudio.play).toHaveBeenCalled()
    expect(initAudioContext).toHaveBeenCalledWith(restoredAudio)
    expect(setNativeHandoffActive).not.toHaveBeenCalledWith(false)
  })
})
