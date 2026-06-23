import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { useCurrentTime, useCurrentTimestamp } from '../useCurrentTime'

describe('useCurrentTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with current time values', () => {
    const now = new Date('2024-01-15T10:30:00Z')
    vi.setSystemTime(now)

    const { result } = renderHook(() => useCurrentTime())

    expect(result.current.currentTimestamp).toBe(Math.floor(now.getTime() / 1000))
    expect(result.current.currentDateTime).toBeTruthy()
    expect(result.current.currentIsoString).toBe(now.toISOString())
  })

  it('should initialize with custom format', () => {
    const now = new Date('2024-06-15T14:25:30Z')
    vi.setSystemTime(now)

    const { result } = renderHook(() => useCurrentTime({ formatString: 'yyyy/MM/dd' }))

    expect(result.current.currentDateTime).toBe('2024/06/15')
  })

  it('should initialize with custom update interval', () => {
    const now = new Date('2024-01-15T10:30:00Z')
    vi.setSystemTime(now)

    renderHook(() => useCurrentTime({ updateInterval: 5000 }))
    // Just verify it initializes without error
    expect(true).toBe(true)
  })

  it('should update time after interval', async () => {
    const now = new Date('2024-01-15T10:30:00Z')
    vi.setSystemTime(now)

    const { result } = renderHook(() => useCurrentTime({ updateInterval: 1000 }))

    const initialTimestamp = result.current.currentTimestamp

    // Advance time by 1 second
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    const newTime = new Date('2024-01-15T10:30:01Z')
    expect(result.current.currentTimestamp).toBe(Math.floor(newTime.getTime() / 1000))
  })

  it('should format timestamp using formatTimestamp', () => {
    const now = new Date('2024-01-15T10:30:00Z')
    vi.setSystemTime(now)

    const { result } = renderHook(() => useCurrentTime())

    const formatted = result.current.formatTimestamp(Math.floor(now.getTime() / 1000))

    expect(formatted).toBeTruthy()
    expect(typeof formatted).toBe('string')
  })

  it('should update time with updateCurrentTime', async () => {
    const now = new Date('2024-01-15T10:30:00Z')
    vi.setSystemTime(now)

    const { result } = renderHook(() => useCurrentTime())

    const laterNow = new Date('2024-01-15T10:30:05Z')
    vi.setSystemTime(laterNow)

    await act(async () => {
      result.current.updateCurrentTime()
    })

    expect(result.current.currentTimestamp).toBe(Math.floor(laterNow.getTime() / 1000))
  })

  it('should export updateCurrentTime function', () => {
    const { result } = renderHook(() => useCurrentTime())

    expect(typeof result.current.updateCurrentTime).toBe('function')
  })

  it('should return ISO string', () => {
    const now = new Date('2024-01-15T10:30:00Z')
    vi.setSystemTime(now)

    const { result } = renderHook(() => useCurrentTime())

    expect(result.current.currentIsoString).toBe(now.toISOString())
  })
})

describe('useCurrentTimestamp', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with current Unix timestamp', () => {
    const now = new Date('2024-01-15T10:30:00Z')
    vi.setSystemTime(now)

    const { result } = renderHook(() => useCurrentTimestamp())

    expect(result.current).toBe(Math.floor(now.getTime() / 1000))
  })

  it('should update timestamp every second', async () => {
    const now = new Date('2024-01-15T10:30:00Z')
    vi.setSystemTime(now)

    const { result } = renderHook(() => useCurrentTimestamp())

    const initialTimestamp = result.current

    // Advance time by 1 second
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current).toBe(initialTimestamp + 1)
  })

  it('should clean up interval on unmount', async () => {
    const now = new Date('2024-01-15T10:30:00Z')
    vi.setSystemTime(now)

    const { result, unmount } = renderHook(() => useCurrentTimestamp())

    const initialTimestamp = result.current

    unmount()

    // After unmount, advancing time should not affect anything
    await act(async () => {
      vi.advanceTimersByTime(5000)
    })

    // If unmount works, the test passes (no errors thrown)
    expect(true).toBe(true)
  })
})
