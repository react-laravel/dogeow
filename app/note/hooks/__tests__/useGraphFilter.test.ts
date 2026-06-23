import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGraphFilter } from '../useGraphFilter'
import type { NodeData, LinkData } from '../../types/graph'

const createNode = (overrides: Partial<NodeData> = {}): NodeData => ({
  id: '1',
  title: 'Node 1',
  slug: 'node-1',
  tags: [],
  summary: '',
  ...overrides,
})

const createLink = (overrides: Partial<LinkData> = {}): LinkData => ({
  source: '1',
  target: '2',
  type: '',
  ...overrides,
})

describe('useGraphFilter', () => {
  it('should return all nodes and links when query is empty', () => {
    const nodes = [createNode({ id: '1' }), createNode({ id: '2' })]
    const links = [createLink({ source: '1', target: '2' })]

    const { result } = renderHook(() => useGraphFilter(nodes, links, '', false, null))

    expect(result.current.filtered.nodes).toHaveLength(2)
    expect(result.current.filtered.links).toHaveLength(1)
  })

  it('should filter nodes by title', () => {
    const nodes = [
      createNode({ id: '1', title: 'React Tutorial' }),
      createNode({ id: '2', title: 'Vue Guide' }),
      createNode({ id: '3', title: 'Angular Docs' }),
    ]
    const links: LinkData[] = []

    const { result } = renderHook(() => useGraphFilter(nodes, links, 'react', false, null))

    expect(result.current.filtered.nodes).toHaveLength(1)
    expect(result.current.filtered.nodes[0].title).toBe('React Tutorial')
  })

  it('should filter nodes by slug', () => {
    const nodes = [
      createNode({ id: '1', title: 'Node A', slug: 'react-tutorial' }),
      createNode({ id: '2', title: 'Node B', slug: 'vue-guide' }),
    ]
    const links: LinkData[] = []

    const { result } = renderHook(() => useGraphFilter(nodes, links, 'react', false, null))

    expect(result.current.filtered.nodes).toHaveLength(1)
    expect(result.current.filtered.nodes[0].slug).toBe('react-tutorial')
  })

  it('should filter nodes by tags', () => {
    const nodes = [
      createNode({ id: '1', title: 'Node A', tags: ['javascript'] }),
      createNode({ id: '2', title: 'Node B', tags: ['python'] }),
      createNode({ id: '3', title: 'Node C', tags: ['javascript', 'typescript'] }),
    ]
    const links: LinkData[] = []

    const { result } = renderHook(() => useGraphFilter(nodes, links, 'javascript', false, null))

    expect(result.current.filtered.nodes).toHaveLength(2)
  })

  it('should filter nodes by summary', () => {
    const nodes = [
      createNode({ id: '1', title: 'Node A', summary: 'A guide to React' }),
      createNode({ id: '2', title: 'Node B', summary: 'A guide to Vue' }),
    ]
    const links: LinkData[] = []

    const { result } = renderHook(() => useGraphFilter(nodes, links, 'vue', false, null))

    expect(result.current.filtered.nodes).toHaveLength(1)
    expect(result.current.filtered.nodes[0].title).toBe('Node B')
  })

  it('should include neighbors of matched nodes in search results', () => {
    const nodes = [
      createNode({ id: '1', title: 'React' }),
      createNode({ id: '2', title: 'JavaScript' }),
      createNode({ id: '3', title: 'TypeScript' }),
    ]
    const links = [
      createLink({ source: '1', target: '2' }),
      createLink({ source: '2', target: '3' }),
    ]

    const { result } = renderHook(() => useGraphFilter(nodes, links, 'react', false, null))

    // Should include React (matched) and JavaScript (neighbor)
    expect(result.current.filtered.nodes.length).toBeGreaterThanOrEqual(2)
  })

  it('should filter links to only include connected filtered nodes', () => {
    const nodes = [
      createNode({ id: '1', title: 'React' }),
      createNode({ id: '2', title: 'JavaScript' }),
      createNode({ id: '3', title: 'Python' }),
    ]
    const links = [
      createLink({ id: 1, source: '1', target: '2' }),
      createLink({ id: 2, source: '2', target: '3' }),
    ]

    const { result } = renderHook(() => useGraphFilter(nodes, links, 'react', false, null))

    // Only links between filtered nodes should be included
    const filteredIds = new Set(result.current.filtered.nodes.map(n => String(n.id)))
    for (const link of result.current.filtered.links) {
      const sourceId =
        typeof link.source === 'string' || typeof link.source === 'number'
          ? String(link.source)
          : String((link.source as NodeData).id)
      const targetId =
        typeof link.target === 'string' || typeof link.target === 'number'
          ? String(link.target)
          : String((link.target as NodeData).id)
      expect(filteredIds.has(sourceId)).toBe(true)
      expect(filteredIds.has(targetId)).toBe(true)
    }
  })

  it('should filter by neighbors only when activeNode is set', () => {
    const activeNode = createNode({ id: '2', title: 'Active Node' })
    const nodes = [
      createNode({ id: '1', title: 'Node 1' }),
      activeNode,
      createNode({ id: '3', title: 'Node 3' }),
    ]
    const links = [
      createLink({ source: '1', target: '2' }),
      createLink({ source: '2', target: '3' }),
    ]

    const { result } = renderHook(() => useGraphFilter(nodes, links, '', true, activeNode))

    // Should only include active node and its neighbors
    const filteredIds = new Set(result.current.filtered.nodes.map(n => String(n.id)))
    expect(filteredIds.has('2')).toBe(true)
    // At least one neighbor should be included
    expect(result.current.filtered.nodes.length).toBeGreaterThanOrEqual(1)
  })

  it('should return all nodes when showNeighborsOnly is false', () => {
    const activeNode = createNode({ id: '2', title: 'Active' })
    const nodes = [
      createNode({ id: '1', title: 'Node 1' }),
      activeNode,
      createNode({ id: '3', title: 'Node 3' }),
    ]
    const links: LinkData[] = []

    const { result } = renderHook(() => useGraphFilter(nodes, links, '', false, activeNode))

    expect(result.current.filtered.nodes).toHaveLength(3)
  })

  it('should compute neighborIds for active node', () => {
    const activeNode = createNode({ id: '2', title: 'Active' })
    const nodes = [
      createNode({ id: '1', title: 'Node 1' }),
      activeNode,
      createNode({ id: '3', title: 'Node 3' }),
    ]
    const links = [createLink({ source: '1', target: '2' })]

    const { result } = renderHook(() => useGraphFilter(nodes, links, '', true, activeNode))

    const neighborIds = result.current.neighborIds as Set<string>
    expect(neighborIds.has('2')).toBe(true)
    expect(neighborIds.has('1')).toBe(true)
  })

  it('should handle numeric node IDs', () => {
    const nodes = [createNode({ id: 1, title: 'Node 1' }), createNode({ id: 2, title: 'Node 2' })]
    const links = [createLink({ source: 1, target: 2 })]

    const { result } = renderHook(() => useGraphFilter(nodes, links, '', false, null))

    expect(result.current.filtered.nodes).toHaveLength(2)
    expect(result.current.filtered.links).toHaveLength(1)
  })

  it('should handle link source/target as objects', () => {
    const nodes = [
      createNode({ id: '1', title: 'Node 1' }),
      createNode({ id: '2', title: 'Node 2' }),
    ]
    const links = [
      createLink({
        source: createNode({ id: '1' }),
        target: createNode({ id: '2' }),
      }),
    ]

    const { result } = renderHook(() => useGraphFilter(nodes, links, '', false, null))

    expect(result.current.filtered.nodes).toHaveLength(2)
    expect(result.current.filtered.links).toHaveLength(1)
  })

  it('should handle case-insensitive search', () => {
    const nodes = [
      createNode({ id: '1', title: 'REACT TUTORIAL' }),
      createNode({ id: '2', title: 'vue guide' }),
    ]
    const links: LinkData[] = []

    const { result } = renderHook(() => useGraphFilter(nodes, links, 'react', false, null))

    expect(result.current.filtered.nodes).toHaveLength(1)
    expect(result.current.filtered.nodes[0].title).toBe('REACT TUTORIAL')
  })

  it('should return empty filtered results for non-matching query', () => {
    const nodes = [createNode({ id: '1', title: 'Node 1' })]
    const links: LinkData[] = []

    const { result } = renderHook(() => useGraphFilter(nodes, links, 'nonexistent', false, null))

    expect(result.current.filtered.nodes).toHaveLength(0)
    expect(result.current.filtered.links).toHaveLength(0)
  })
})
