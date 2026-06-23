import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameSound } from '../useGameSound'

// Mock AudioContext
const mockAudioContext = {
  createOscillator: () => ({
    connect: vi.fn(),
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    start: vi.fn(),
    stop: vi.fn(),
  }),
  createGain: () => ({
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  }),
  destination: {},
  state: 'running',
  resume: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  const AudioContextMock = vi.fn().mockImplementation(function AudioContext() {
    return mockAudioContext
  })
  ;(window as unknown as { AudioContext: typeof AudioContextMock }).AudioContext = AudioContextMock
  ;(global as unknown as { AudioContext: typeof AudioContextMock }).AudioContext = AudioContextMock
})

describe('useGameSound', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useGameSound())

    expect(result.current.isSupported).toBe(true)
    expect(result.current.isInitialized).toBe(false)
    expect(typeof result.current.playSound).toBe('function')
  })

  it('should initialize with custom options', () => {
    const { result } = renderHook(() =>
      useGameSound({
        frequencyStart: 800,
        frequencyEnd: 400,
        duration: 0.2,
        volume: 0.3,
      })
    )

    expect(result.current.isSupported).toBe(true)
  })

  it('should initialize audio context on first playSound call', async () => {
    const AudioContextMock = vi.fn().mockImplementation(function AudioContext() {
      return mockAudioContext
    })
    ;(window as unknown as { AudioContext: typeof AudioContextMock }).AudioContext =
      AudioContextMock
    ;(global as unknown as { AudioContext: typeof AudioContextMock }).AudioContext =
      AudioContextMock

    const { result } = renderHook(() => useGameSound())

    await act(async () => {
      await result.current.playSound()
    })

    expect(AudioContextMock).toHaveBeenCalled()
  })

  it('should return isSupported false when AudioContext is not available', () => {
    const originalAudioContext = (global as unknown as { AudioContext?: unknown }).AudioContext
    const originalWindowAudioContext = window.AudioContext
    ;(global as unknown as { AudioContext: undefined }).AudioContext = undefined
    ;(window as unknown as { AudioContext: undefined }).AudioContext = undefined

    const { result } = renderHook(() => useGameSound())

    expect(result.current.isSupported).toBe(false)

    // Restore
    if (originalAudioContext) {
      ;(global as unknown as { AudioContext: typeof originalAudioContext }).AudioContext =
        originalAudioContext
    }
    if (originalWindowAudioContext) {
      window.AudioContext = originalWindowAudioContext
    }
  })

  it('should handle playSound when not supported', async () => {
    const originalAudioContext = (global as unknown as { AudioContext?: unknown }).AudioContext
    const originalWindowAudioContext = window.AudioContext
    ;(global as unknown as { AudioContext: undefined }).AudioContext = undefined
    ;(window as unknown as { AudioContext: undefined }).AudioContext = undefined

    const { result } = renderHook(() => useGameSound())

    // Should not throw
    await act(async () => {
      await result.current.playSound()
    })

    // Restore
    if (originalAudioContext) {
      ;(global as unknown as { AudioContext: typeof originalAudioContext }).AudioContext =
        originalAudioContext
    }
    if (originalWindowAudioContext) {
      window.AudioContext = originalWindowAudioContext
    }
  })
})
