import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimeConversion } from '../useTimeConversion'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useTimeConversion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates conversion result when timestamp input changes', () => {
    const { result } = renderHook(() => useTimeConversion())

    act(() => {
      result.current.handleTimestampChange('1600000000')
    })
    expect(result.current.timestamp).toBe('1600000000')
    expect(result.current.dateTime).toMatch(/2020/)

    act(() => {
      result.current.handleTimestampChange('1700000000')
    })
    expect(result.current.timestamp).toBe('1700000000')
    expect(result.current.dateTime).toMatch(/2023/)
    expect(result.current.dateTime).not.toMatch(/2020-09/)
  })

  it('clears result when timestamp input is cleared', () => {
    const { result } = renderHook(() => useTimeConversion())

    act(() => {
      result.current.handleTimestampChange('1600000000')
    })
    expect(result.current.dateTime).not.toBe('')

    act(() => {
      result.current.handleTimestampChange('')
    })
    expect(result.current.dateTime).toBe('')
  })

  it('updates output when date input changes', () => {
    const { result } = renderHook(() => useTimeConversion())

    act(() => {
      result.current.handleInputDateTimeChange('2020-09-13 12:26:40')
    })
    const first = result.current.outputTimestamp
    expect(first).toMatch(/^\d+$/)

    act(() => {
      result.current.handleInputDateTimeChange('2023-11-14 22:13:20')
    })
    const second = result.current.outputTimestamp
    expect(second).toMatch(/^\d+$/)
    expect(second).not.toBe(first)
  })

  it('rejects non-numeric garbage instead of converting to epoch/1969', () => {
    const { result } = renderHook(() => useTimeConversion())

    act(() => {
      result.current.handleTimestampChange('abc')
    })

    expect(result.current.timestamp).toBe('abc')
    expect(result.current.dateTime).toBe('无效的时间戳')
    expect(result.current.dateTime).not.toMatch(/1969|1970/)
  })
})
