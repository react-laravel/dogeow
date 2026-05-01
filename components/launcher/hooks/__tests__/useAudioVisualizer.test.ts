import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAudioVisualizer } from '../useAudioVisualizer'

const win = window as typeof window & { webkitAudioContext?: typeof AudioContext }
const originalAudioContext = win.AudioContext
const originalWebkitAudioContext = win.webkitAudioContext

describe('useAudioVisualizer', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      writable: true,
      value: originalAudioContext,
    })
    Object.defineProperty(window, 'webkitAudioContext', {
      configurable: true,
      writable: true,
      value: originalWebkitAudioContext,
    })
  })

  it('falls back to MediaElementAudioSource when captureStream is unavailable', () => {
    const sourceConnect = vi.fn()
    const analyserConnect = vi.fn()
    const gainConnect = vi.fn()
    const mediaElementSource = { connect: sourceConnect } as unknown as MediaElementAudioSourceNode
    const analyserNode = {
      connect: analyserConnect,
      fftSize: 0,
      smoothingTimeConstant: 0,
      frequencyBinCount: 32,
      getByteFrequencyData: vi.fn(),
    } as unknown as AnalyserNode
    const gainNode = {
      connect: gainConnect,
      gain: { value: 0 },
    } as unknown as GainNode
    const destinationNode = {} as unknown as AudioDestinationNode
    const createMediaElementSource = vi.fn(() => mediaElementSource)
    const createMediaStreamSource = vi.fn()

    class MockAudioContext {
      public readonly state: AudioContextState = 'running'
      public readonly destination = destinationNode
      public readonly createAnalyser = vi.fn(() => analyserNode)
      public readonly createGain = vi.fn(() => gainNode)
      public readonly createMediaElementSource = createMediaElementSource
      public readonly createMediaStreamSource = createMediaStreamSource
      public readonly resume = vi.fn(() => Promise.resolve())
    }

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      writable: true,
      value: MockAudioContext,
    })

    const audioElement = document.createElement('audio')
    const { result } = renderHook(() => useAudioVisualizer({ volume: 0.7, isMuted: false }))

    act(() => {
      result.current.initAudioContext(audioElement)
    })

    expect(createMediaElementSource).toHaveBeenCalledWith(audioElement)
    expect(createMediaStreamSource).not.toHaveBeenCalled()
    expect(sourceConnect).toHaveBeenCalledWith(analyserNode)
    expect(analyserConnect).toHaveBeenCalledWith(gainNode)
    expect(gainConnect).toHaveBeenCalledWith(destinationNode)
    expect(gainNode.gain.value).toBe(1)
    expect(result.current.analyserNode).toBe(analyserNode)
  })
})
