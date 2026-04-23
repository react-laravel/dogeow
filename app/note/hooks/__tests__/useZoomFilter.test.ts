import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useZoomFilter } from '../useZoomFilter'
import type { ForceGraphInstance } from '../../types/graph'

const { mockLoggerWarn } = vi.hoisted(() => ({
  mockLoggerWarn: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: mockLoggerWarn,
  },
}))

describe('useZoomFilter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should allow the zoom event when the original filter throws and keep observability', () => {
    const originalFilter = vi.fn(() => {
      throw new Error('boom')
    })

    let currentFilter: ((event: Event | null) => boolean) | undefined = originalFilter
    const zoom = {
      filter: vi.fn(function (filter?: (event: Event | null) => boolean) {
        if (arguments.length === 0) {
          return currentFilter
        }

        currentFilter = filter
        return zoom
      }),
    }

    const fgRef = {
      current: {
        d3Zoom: () => zoom,
      } as ForceGraphInstance,
    } as React.RefObject<ForceGraphInstance | null>

    renderHook(() => useZoomFilter(fgRef))

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(currentFilter).toBeTypeOf('function')

    const result = currentFilter?.(new Event('wheel'))

    expect(result).toBe(true)
    expect(mockLoggerWarn).toHaveBeenCalledOnce()
    expect(mockLoggerWarn.mock.calls[0]?.[0]).toContain('D3 zoom filter 执行失败')
    expect(mockLoggerWarn.mock.calls[0]?.[1]).toBeInstanceOf(Error)
  })
})
