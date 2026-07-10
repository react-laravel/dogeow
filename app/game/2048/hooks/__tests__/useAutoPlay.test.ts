import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutoPlay } from '../useAutoPlay'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useAutoPlay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() =>
      useAutoPlay({
        onMove: vi.fn(),
      })
    )

    expect(result.current.isRunning).toBe(false)
    expect(result.current.isDirectional).toBe(false)
    expect(result.current.currentDirection).toBe('down')
    expect(result.current.speed).toBe(500)
  })

  it('should initialize with custom speed', () => {
    const { result } = renderHook(() =>
      useAutoPlay({
        onMove: vi.fn(),
        speed: 200,
      })
    )

    expect(result.current.speed).toBe(200)
  })

  it('should return disabled controls when enabled is false', () => {
    const { result } = renderHook(() =>
      useAutoPlay({
        onMove: vi.fn(),
        enabled: false,
      })
    )

    expect(result.current.isRunning).toBe(false)
    expect(result.current.startRandom).toBeInstanceOf(Function)
    expect(result.current.stop).toBeInstanceOf(Function)
  })

  it('should start and stop random auto-play', async () => {
    const onMove = vi.fn()

    const { result } = renderHook(() =>
      useAutoPlay({
        onMove,
      })
    )

    expect(result.current.isRunning).toBe(false)

    await act(async () => {
      result.current.startRandom()
    })

    expect(result.current.isRunning).toBe(true)
    expect(result.current.isDirectional).toBe(false)

    await act(async () => {
      result.current.stop()
    })

    expect(result.current.isRunning).toBe(false)
  })

  it('should start and stop clockwise directional auto-play', async () => {
    const onMove = vi.fn()

    const { result } = renderHook(() =>
      useAutoPlay({
        onMove,
      })
    )

    await act(async () => {
      result.current.startDirectional(true)
    })

    expect(result.current.isRunning).toBe(true)
    expect(result.current.isDirectional).toBe(true)
    expect(result.current.isClockwise).toBe(true)

    await act(async () => {
      result.current.stop()
    })

    expect(result.current.isRunning).toBe(false)
  })

  it('should start and stop counter-clockwise directional auto-play', async () => {
    const onMove = vi.fn()

    const { result } = renderHook(() =>
      useAutoPlay({
        onMove,
      })
    )

    await act(async () => {
      result.current.startDirectional(false)
    })

    expect(result.current.isRunning).toBe(true)
    expect(result.current.isDirectional).toBe(true)
    expect(result.current.isClockwise).toBe(false)

    await act(async () => {
      result.current.stop()
    })

    expect(result.current.isRunning).toBe(false)
  })

  it('should toggle random auto-play', async () => {
    const onMove = vi.fn()

    const { result } = renderHook(() =>
      useAutoPlay({
        onMove,
      })
    )

    // Start
    await act(async () => {
      result.current.toggleRandom()
    })
    expect(result.current.isRunning).toBe(true)

    // Stop
    await act(async () => {
      result.current.toggleRandom()
    })
    expect(result.current.isRunning).toBe(false)
  })

  it('should toggle clockwise auto-play', async () => {
    const onMove = vi.fn()

    const { result } = renderHook(() =>
      useAutoPlay({
        onMove,
      })
    )

    // Start clockwise
    await act(async () => {
      result.current.toggleClockwise()
    })
    expect(result.current.isRunning).toBe(true)
    expect(result.current.isClockwise).toBe(true)

    // Stop
    await act(async () => {
      result.current.toggleClockwise()
    })
    expect(result.current.isRunning).toBe(false)
  })

  it('should toggle counter-clockwise auto-play', async () => {
    const onMove = vi.fn()

    const { result } = renderHook(() =>
      useAutoPlay({
        onMove,
      })
    )

    // Start counter-clockwise
    await act(async () => {
      result.current.toggleCounterClockwise()
    })
    expect(result.current.isRunning).toBe(true)
    expect(result.current.isClockwise).toBe(false)

    // Stop
    await act(async () => {
      result.current.toggleCounterClockwise()
    })
    expect(result.current.isRunning).toBe(false)
  })

  it('should change speed', async () => {
    const onMove = vi.fn()

    const { result } = renderHook(() =>
      useAutoPlay({
        onMove,
        speed: 500,
      })
    )

    await act(async () => {
      result.current.changeSpeed(200)
    })

    expect(result.current.speed).toBe(200)
  })

  it('uses the latest move callback and restarts the interval at the new speed', () => {
    vi.useFakeTimers()
    const firstOnMove = vi.fn()
    const latestOnMove = vi.fn()
    const { result, rerender } = renderHook(({ onMove }) => useAutoPlay({ onMove }), {
      initialProps: { onMove: firstOnMove },
    })

    act(() => result.current.startRandom())
    act(() => vi.advanceTimersByTime(500))
    expect(firstOnMove).toHaveBeenCalledOnce()

    rerender({ onMove: latestOnMove })
    act(() => result.current.changeSpeed(200))
    act(() => vi.advanceTimersByTime(199))
    expect(latestOnMove).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))
    expect(latestOnMove).toHaveBeenCalledOnce()
  })

  it('resets mode, direction, and speed together', () => {
    const { result } = renderHook(() => useAutoPlay({ onMove: vi.fn(), speed: 200 }))

    act(() => result.current.startDirectional(false))
    act(() => result.current.changeSpeed(1000))
    act(() => result.current.reset())

    expect(result.current.isRunning).toBe(false)
    expect(result.current.isClockwise).toBe(true)
    expect(result.current.currentDirection).toBe('down')
    expect(result.current.speed).toBe(200)
  })

  it('should have no-op methods when disabled', async () => {
    const { result } = renderHook(() =>
      useAutoPlay({
        onMove: vi.fn(),
        enabled: false,
      })
    )

    // Should not throw
    await act(async () => {
      result.current.startRandom()
      result.current.startDirectional(true)
      result.current.stop()
      result.current.changeSpeed(100)
      result.current.toggleRandom()
      result.current.toggleClockwise()
      result.current.toggleCounterClockwise()
    })

    expect(result.current.isRunning).toBe(false)
  })
})
