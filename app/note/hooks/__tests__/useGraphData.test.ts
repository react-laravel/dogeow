import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useGraphData } from '../useGraphData'

const { mockGetWikiGraph, mockLoggerError, mockLoggerWarn, mockToastError } = vi.hoisted(() => ({
  mockGetWikiGraph: vi.fn(),
  mockLoggerError: vi.fn(),
  mockLoggerWarn: vi.fn(),
  mockToastError: vi.fn(),
}))

vi.mock('@/lib/api/wiki', () => ({
  getWikiGraph: mockGetWikiGraph,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: mockLoggerError,
    warn: mockLoggerWarn,
  },
}))

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
  },
}))

describe('useGraphData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useGraphData())

    expect(result.current.nodes).toEqual([])
    expect(result.current.links).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.fgRef).toBeDefined()
    expect(result.current.fgRef.current).toBeNull()
  })

  it('should load graph data successfully', async () => {
    const mockData = {
      nodes: [
        { id: '1', title: 'Node 1', slug: 'node-1', tags: ['tag1'], summary: 'Summary 1' },
        { id: '2', title: 'Node 2', slug: 'node-2', tags: [], summary: '' },
      ],
      links: [{ id: 1, source: '1', target: '2', type: 'related' }],
    }
    mockGetWikiGraph.mockResolvedValue(mockData)

    const { result } = renderHook(() => useGraphData())

    await act(async () => {
      await result.current.loadGraphData()
    })

    expect(result.current.nodes).toHaveLength(2)
    expect(result.current.links).toHaveLength(1)
    expect(result.current.loading).toBe(false)
    expect(result.current.nodes[0].title).toBe('Node 1')
    expect(result.current.nodes[1].title).toBe('Node 2')
  })

  it('should handle empty nodes and links from API', async () => {
    mockGetWikiGraph.mockResolvedValue({ nodes: [], links: [] })

    const { result } = renderHook(() => useGraphData())

    await act(async () => {
      await result.current.loadGraphData()
    })

    expect(result.current.nodes).toEqual([])
    expect(result.current.links).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it('should handle API errors', async () => {
    const error = new Error('Network error')
    mockGetWikiGraph.mockRejectedValue(error)

    const { result } = renderHook(() => useGraphData())

    await act(async () => {
      await result.current.loadGraphData()
    })

    expect(result.current.loading).toBe(false)
    expect(mockLoggerError).toHaveBeenCalledWith('加载图谱数据失败:', error)
    expect(mockToastError).toHaveBeenCalledWith('加载图谱数据失败')
  })

  it('should normalize nodes with default values', async () => {
    const mockData = {
      nodes: [{ id: '1', title: 'Node 1', slug: 'node-1' }],
      links: [],
    }
    mockGetWikiGraph.mockResolvedValue(mockData)

    const { result } = renderHook(() => useGraphData())

    await act(async () => {
      await result.current.loadGraphData()
    })

    expect(result.current.nodes[0].tags).toEqual([])
    expect(result.current.nodes[0].summary).toBe('')
  })

  it('should handle nodes returned as an object instead of array', async () => {
    const mockData = {
      nodes: { data: [{ id: '1', title: 'Node 1', slug: 'node-1' }] },
      links: { data: [] },
    }
    mockGetWikiGraph.mockResolvedValue(mockData)

    const { result } = renderHook(() => useGraphData())

    await act(async () => {
      await result.current.loadGraphData()
    })

    // When nodes/links are not arrays, they should be treated as empty
    expect(result.current.nodes).toEqual([])
    expect(result.current.links).toEqual([])
  })

  it('should allow manual node updates via setNodes', async () => {
    const { result } = renderHook(() => useGraphData())

    act(() => {
      result.current.setNodes([{ id: '3', title: 'New Node', slug: 'new', tags: [], summary: '' }])
    })

    expect(result.current.nodes).toHaveLength(1)
    expect(result.current.nodes[0].title).toBe('New Node')
  })

  it('should allow manual link updates via setLinks', async () => {
    const { result } = renderHook(() => useGraphData())

    act(() => {
      result.current.setLinks([{ id: 1, source: '1', target: '2', type: 'test' }])
    })

    expect(result.current.links).toHaveLength(1)
    expect(result.current.links[0].type).toBe('test')
  })

  it('should resume graph animation without errors', async () => {
    const { result } = renderHook(() => useGraphData())

    // Should not throw when fgRef is null
    expect(() => result.current.resumeGraphAnimation()).not.toThrow()

    // Should work when fgRef has a mock graph
    const mockGraph = {
      d3ReheatSimulation: vi.fn(),
      resumeAnimation: vi.fn(),
    }
    result.current.fgRef.current = mockGraph as never

    act(() => {
      result.current.resumeGraphAnimation()
    })

    expect(mockGraph.d3ReheatSimulation).toHaveBeenCalled()
    expect(mockGraph.resumeAnimation).toHaveBeenCalled()
  })

  it('should resume animation with partial support', async () => {
    const { result } = renderHook(() => useGraphData())

    const mockGraph = {
      d3ReheatSimulation: vi.fn(),
      // resumeAnimation not available
    }
    result.current.fgRef.current = mockGraph as never

    act(() => {
      result.current.resumeGraphAnimation()
    })

    expect(mockGraph.d3ReheatSimulation).toHaveBeenCalled()
  })

  it('should handle animation errors gracefully', async () => {
    const { result } = renderHook(() => useGraphData())

    const mockGraph = {
      d3ReheatSimulation: () => {
        throw new Error('Animation error')
      },
      resumeAnimation: vi.fn(),
    }
    result.current.fgRef.current = mockGraph as never

    // Should not throw
    expect(() => result.current.resumeGraphAnimation()).not.toThrow()
  })

  it('should set loading to true at start of loadGraphData', async () => {
    let resolveLoad: (value: unknown) => void
    const loadPromise = new Promise(resolve => {
      resolveLoad = resolve
    })
    mockGetWikiGraph.mockReturnValue(loadPromise)

    const { result } = renderHook(() => useGraphData())

    // Initially loading is true
    expect(result.current.loading).toBe(true)

    // After loading starts, it should remain true until resolved
    await act(async () => {
      result.current.loadGraphData()
    })

    expect(result.current.loading).toBe(true)

    await act(async () => {
      resolveLoad!({ nodes: [], links: [] })
    })

    expect(result.current.loading).toBe(false)
  })

  it('should set loading to false even on error', async () => {
    mockGetWikiGraph.mockRejectedValue(new Error('fail'))

    const { result } = renderHook(() => useGraphData())

    await act(async () => {
      await result.current.loadGraphData()
    })

    expect(result.current.loading).toBe(false)
  })
})
