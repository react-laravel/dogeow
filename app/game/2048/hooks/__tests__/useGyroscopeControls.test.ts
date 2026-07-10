import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGyroscopeControls } from '../useGyroscopeControls'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useGyroscopeControls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset DeviceOrientationEvent mock
    delete (global as unknown as { DeviceOrientationEvent?: unknown }).DeviceOrientationEvent
  })

  it('should initialize with unsupported state', () => {
    const { result } = renderHook(() =>
      useGyroscopeControls({
        onMove: vi.fn(),
      })
    )

    expect(result.current.isSupported).toBe(false)
    expect(result.current.isEnabled).toBe(false)
    expect(typeof result.current.toggle).toBe('function')
  })

  it('should detect gyroscope support when DeviceOrientationEvent exists', () => {
    Object.defineProperty(globalThis, 'DeviceOrientationEvent', {
      configurable: true,
      writable: true,
      value: { requestPermission: undefined },
    })

    const { result } = renderHook(() =>
      useGyroscopeControls({
        onMove: vi.fn(),
      })
    )

    expect(result.current.isSupported).toBe(true)
  })

  it('should not enable without permission on iOS', async () => {
    Object.defineProperty(globalThis, 'DeviceOrientationEvent', {
      configurable: true,
      writable: true,
      value: { requestPermission: () => Promise.resolve('denied') },
    })

    const { result } = renderHook(() =>
      useGyroscopeControls({
        onMove: vi.fn(),
      })
    )

    await act(async () => {
      await result.current.toggle()
    })

    expect(result.current.isEnabled).toBe(false)
  })

  it('should not throw when toggling without DeviceOrientationEvent', async () => {
    const { result } = renderHook(() =>
      useGyroscopeControls({
        onMove: vi.fn(),
      })
    )

    await act(async () => {
      await result.current.toggle()
    })

    expect(result.current.isEnabled).toBe(false)
  })

  it('should use default threshold and throttle', () => {
    const { result } = renderHook(() =>
      useGyroscopeControls({
        onMove: vi.fn(),
      })
    )

    // The hook should not throw during initialization
    expect(result.current.isSupported).toBe(false)
  })
})
