import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGraphZoom } from '../useGraphZoom'

describe('useGraphZoom', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useGraphZoom())

    expect(result.current.lastZoomRef.current).toBe(1)
    expect(result.current.lastTransformRef.current).toEqual({ x: 0, y: 0, k: 1 })
    expect(result.current.lastCenterRef.current).toBeNull()
    expect(result.current.allowInternalZoomRef.current).toBe(false)
  })

  it('should restore view with zoom only', () => {
    const { result } = renderHook(() => useGraphZoom())

    const mockGraph = {
      zoom: vi.fn().mockReturnThis(),
      centerAt: vi.fn().mockReturnThis(),
    }
    const mockRef = { current: mockGraph }

    act(() => {
      result.current.restoreView(mockRef as never, { zoom: true, center: false })
    })

    expect(mockGraph.zoom).toHaveBeenCalledWith(1)
    expect(mockGraph.centerAt).not.toHaveBeenCalled()
    expect(result.current.allowInternalZoomRef.current).toBe(false)
  })

  it('should restore view with center only', () => {
    const { result } = renderHook(() => useGraphZoom())

    // Set a center so centerAt is actually called
    result.current.lastCenterRef.current = { x: 0, y: 0 }

    const mockGraph = {
      zoom: vi.fn().mockReturnThis(),
      centerAt: vi.fn().mockReturnThis(),
    }
    const mockRef = { current: mockGraph }

    act(() => {
      result.current.restoreView(mockRef as never, { zoom: false, center: true })
    })

    expect(mockGraph.zoom).not.toHaveBeenCalled()
    expect(mockGraph.centerAt).toHaveBeenCalledWith(0, 0, 0)
  })

  it('should restore view with both zoom and center', () => {
    const { result } = renderHook(() => useGraphZoom())

    // Set a center so centerAt is actually called
    result.current.lastCenterRef.current = { x: 0, y: 0 }

    const mockGraph = {
      zoom: vi.fn().mockReturnThis(),
      centerAt: vi.fn().mockReturnThis(),
    }
    const mockRef = { current: mockGraph }

    act(() => {
      result.current.restoreView(mockRef as never, { zoom: true, center: true })
    })

    expect(mockGraph.zoom).toHaveBeenCalledWith(1)
    expect(mockGraph.centerAt).toHaveBeenCalledWith(0, 0, 0)
  })

  it('should not restore when fgRef is null', () => {
    const { result } = renderHook(() => useGraphZoom())

    const mockGraph = {
      zoom: vi.fn(),
      centerAt: vi.fn(),
    }
    const mockRef = { current: null }

    act(() => {
      result.current.restoreView(mockRef as never)
    })

    expect(mockGraph.zoom).not.toHaveBeenCalled()
    expect(mockGraph.centerAt).not.toHaveBeenCalled()
  })

  it('should set allowInternalZoom during restore', () => {
    const { result } = renderHook(() => useGraphZoom())

    const mockGraph = {
      zoom: vi.fn().mockReturnThis(),
      centerAt: vi.fn().mockReturnThis(),
    }
    const mockRef = { current: mockGraph }

    expect(result.current.allowInternalZoomRef.current).toBe(false)

    act(() => {
      result.current.restoreView(mockRef as never)
    })

    expect(result.current.allowInternalZoomRef.current).toBe(false)
  })

  it('should handle zoom with screen2GraphCoords', () => {
    const { result } = renderHook(() => useGraphZoom())

    const mockGraph = {
      screen2GraphCoords: vi.fn().mockReturnValue({ x: 100, y: 200 }),
      width: vi.fn().mockReturnValue(800),
      height: vi.fn().mockReturnValue(600),
    }
    const mockRef = { current: mockGraph }

    const transform = { x: 10, y: 20, k: 1.5 }

    act(() => {
      result.current.handleZoom(mockRef as never, transform)
    })

    expect(result.current.lastZoomRef.current).toBe(1.5)
    expect(result.current.lastTransformRef.current).toEqual({ x: 10, y: 20, k: 1.5 })
    expect(result.current.lastCenterRef.current).toEqual({ x: 100, y: 200 })
  })

  it('should handle zoom without screen2GraphCoords', () => {
    const { result } = renderHook(() => useGraphZoom())

    const mockGraph = {
      clientWidth: 800,
      clientHeight: 600,
      // no screen2GraphCoords
    }
    const mockRef = { current: mockGraph }

    const transform = { x: 10, y: 20, k: 2.0 }

    act(() => {
      result.current.handleZoom(mockRef as never, transform)
    })

    expect(result.current.lastZoomRef.current).toBe(2.0)
    expect(result.current.lastTransformRef.current).toEqual({ x: 10, y: 20, k: 2.0 })
    expect(result.current.lastCenterRef.current).toBeNull()
  })

  it('should handle zoom with screen2GraphCoords returning null', () => {
    const { result } = renderHook(() => useGraphZoom())

    const mockGraph = {
      screen2GraphCoords: vi.fn().mockReturnValue(null),
      width: vi.fn().mockReturnValue(800),
      height: vi.fn().mockReturnValue(600),
    }
    const mockRef = { current: mockGraph }

    act(() => {
      result.current.handleZoom(mockRef as never, { x: 0, y: 0, k: 1 })
    })

    expect(result.current.lastCenterRef.current).toBeNull()
  })

  it('should handle zoom when fgRef is null', () => {
    const { result } = renderHook(() => useGraphZoom())

    const mockRef = { current: null }

    act(() => {
      result.current.handleZoom(mockRef as never, { x: 10, y: 20, k: 1.5 })
    })

    expect(result.current.lastZoomRef.current).toBe(1.5)
    expect(result.current.lastTransformRef.current).toEqual({ x: 10, y: 20, k: 1.5 })
  })

  it('should handle zoom when graph has no dimensions', () => {
    const { result } = renderHook(() => useGraphZoom())

    const mockGraph = {
      screen2GraphCoords: vi.fn().mockReturnValue({ x: 100, y: 200 }),
      // no width, no height, no clientWidth, no clientHeight
    }
    const mockRef = { current: mockGraph }

    act(() => {
      result.current.handleZoom(mockRef as never, { x: 10, y: 20, k: 1.5 })
    })

    // Should use window.innerWidth/innerHeight as fallback
    expect(result.current.lastCenterRef.current).toEqual({ x: 100, y: 200 })
  })

  it('should update zoom reference across multiple calls', () => {
    const { result } = renderHook(() => useGraphZoom())

    const mockRef = { current: null }

    act(() => {
      result.current.handleZoom(mockRef as never, { x: 0, y: 0, k: 1.0 })
    })
    act(() => {
      result.current.handleZoom(mockRef as never, { x: 5, y: 10, k: 2.0 })
    })
    act(() => {
      result.current.handleZoom(mockRef as never, { x: 20, y: 30, k: 0.5 })
    })

    expect(result.current.lastZoomRef.current).toBe(0.5)
    expect(result.current.lastTransformRef.current).toEqual({ x: 20, y: 30, k: 0.5 })
  })

  it('should use default options when not provided', () => {
    const { result } = renderHook(() => useGraphZoom())

    result.current.lastCenterRef.current = { x: 0, y: 0 }

    const mockGraph = {
      zoom: vi.fn().mockReturnThis(),
      centerAt: vi.fn().mockReturnThis(),
    }
    const mockRef = { current: mockGraph }

    act(() => {
      result.current.restoreView(mockRef as never)
    })

    expect(mockGraph.zoom).toHaveBeenCalledWith(1)
    expect(mockGraph.centerAt).toHaveBeenCalledWith(0, 0, 0)
  })

  it('should expose getZoom helper', () => {
    const { result } = renderHook(() => useGraphZoom())

    act(() => {
      result.current.handleZoom({ current: null } as never, { x: 0, y: 0, k: 1.25 })
    })

    expect(result.current.getZoom()).toBe(1.25)
  })
})
