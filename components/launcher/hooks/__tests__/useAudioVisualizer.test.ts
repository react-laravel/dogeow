import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAudioVisualizer } from '../useAudioVisualizer'

const win = window as typeof window & { webkitAudioContext?: typeof AudioContext }
const originalAudioContext = win.AudioContext
const originalWebkitAudioContext = win.webkitAudioContext
const originalUserAgent = window.navigator.userAgent
const originalPlatform = window.navigator.platform
const originalMaxTouchPoints = window.navigator.maxTouchPoints

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
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    })
    Object.defineProperty(window.navigator, 'platform', {
      configurable: true,
      value: originalPlatform,
    })
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      configurable: true,
      value: originalMaxTouchPoints,
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
    const { result } = renderHook(() =>
      useAudioVisualizer({ volume: 0.7, isMuted: false, playbackMode: 'auto' })
    )

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

  it('skips Web Audio on iOS when captureStream is unavailable to preserve background playback', () => {
    const createMediaElementSource = vi.fn()

    class MockAudioContext {
      public readonly state: AudioContextState = 'running'
      public readonly destination = {} as AudioDestinationNode
      public readonly createAnalyser = vi.fn()
      public readonly createGain = vi.fn()
      public readonly createMediaElementSource = createMediaElementSource
      public readonly createMediaStreamSource = vi.fn()
      public readonly resume = vi.fn(() => Promise.resolve())
    }

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      writable: true,
      value: MockAudioContext,
    })
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    })
    Object.defineProperty(window.navigator, 'platform', {
      configurable: true,
      value: 'iPhone',
    })
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      configurable: true,
      value: 5,
    })

    const audioElement = document.createElement('audio')
    const { result } = renderHook(() =>
      useAudioVisualizer({ volume: 0.7, isMuted: false, playbackMode: 'auto' })
    )

    act(() => {
      result.current.initAudioContext(audioElement)
    })

    expect(createMediaElementSource).not.toHaveBeenCalled()
    expect(result.current.audioContextRef.current).toBeNull()
    expect(result.current.analyserNode).toBeNull()
  })

  it('allows forcing visualizer playback on iOS when the user opts in', () => {
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

    class MockAudioContext {
      public readonly state: AudioContextState = 'running'
      public readonly destination = destinationNode
      public readonly createAnalyser = vi.fn(() => analyserNode)
      public readonly createGain = vi.fn(() => gainNode)
      public readonly createMediaElementSource = createMediaElementSource
      public readonly createMediaStreamSource = vi.fn()
      public readonly resume = vi.fn(() => Promise.resolve())
    }

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      writable: true,
      value: MockAudioContext,
    })
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    })
    Object.defineProperty(window.navigator, 'platform', {
      configurable: true,
      value: 'iPhone',
    })
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      configurable: true,
      value: 5,
    })

    const audioElement = document.createElement('audio')
    const { result } = renderHook(() =>
      useAudioVisualizer({ volume: 0.7, isMuted: false, playbackMode: 'visualizer' })
    )

    act(() => {
      result.current.initAudioContext(audioElement)
    })

    expect(createMediaElementSource).toHaveBeenCalledWith(audioElement)
    expect(sourceConnect).toHaveBeenCalledWith(analyserNode)
    expect(analyserConnect).toHaveBeenCalledWith(gainNode)
    expect(gainConnect).toHaveBeenCalledWith(destinationNode)
    expect(result.current.analyserNode).toBe(analyserNode)
  })

  it('rebinds a captureStream source after the audio track changes', () => {
    const firstSource = { connect: vi.fn(), disconnect: vi.fn() }
    const nextSource = { connect: vi.fn(), disconnect: vi.fn() }
    const analyserNode = {
      connect: vi.fn(),
      fftSize: 0,
      smoothingTimeConstant: 0,
      frequencyBinCount: 32,
      getByteFrequencyData: vi.fn(),
    } as unknown as AnalyserNode
    const createMediaStreamSource = vi
      .fn()
      .mockReturnValueOnce(firstSource)
      .mockReturnValueOnce(nextSource)

    class MockAudioContext {
      public readonly state: AudioContextState = 'running'
      public readonly destination = {} as AudioDestinationNode
      public readonly createAnalyser = vi.fn(() => analyserNode)
      public readonly createGain = vi.fn(() => ({ connect: vi.fn(), gain: { value: 1 } }))
      public readonly createMediaElementSource = vi.fn()
      public readonly createMediaStreamSource = createMediaStreamSource
      public readonly resume = vi.fn(() => Promise.resolve())
    }

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      writable: true,
      value: MockAudioContext,
    })

    const firstStream = {} as MediaStream
    const nextStream = {} as MediaStream
    const captureStream = vi.fn().mockReturnValueOnce(firstStream).mockReturnValueOnce(nextStream)
    const audioElement = document.createElement('audio') as HTMLAudioElement & {
      captureStream: () => MediaStream
    }
    audioElement.captureStream = captureStream

    const { result } = renderHook(() =>
      useAudioVisualizer({ volume: 0.7, isMuted: false, playbackMode: 'auto' })
    )

    act(() => {
      result.current.initAudioContext(audioElement)
      result.current.refreshAudioSource(audioElement)
    })

    expect(createMediaStreamSource).toHaveBeenNthCalledWith(1, firstStream)
    expect(createMediaStreamSource).toHaveBeenNthCalledWith(2, nextStream)
    expect(nextSource.connect).toHaveBeenCalledWith(analyserNode)
    expect(firstSource.disconnect).toHaveBeenCalled()
    expect(result.current.sourceRef.current).toBe(nextSource)
  })
})
