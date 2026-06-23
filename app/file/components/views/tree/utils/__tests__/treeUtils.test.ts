import { describe, it, expect } from 'vitest'
import { findNodePath, findNodeName } from '../treeUtils'
import type { FolderNode } from '@/app/file/types'

const createNode = (id: number, name: string, children: FolderNode[] = []): FolderNode => ({
  id,
  name,
  children,
})

describe('findNodePath', () => {
  it('should find root node', () => {
    const nodes = [createNode(1, 'root')]
    expect(findNodePath(nodes, 1)).toEqual([1])
  })

  it('should find node in nested tree', () => {
    const nodes = [
      createNode(1, 'root', [
        createNode(2, 'child1', [createNode(3, 'grandchild')]),
        createNode(4, 'child2'),
      ]),
    ]
    expect(findNodePath(nodes, 3)).toEqual([1, 2, 3])
    expect(findNodePath(nodes, 4)).toEqual([1, 4])
  })

  it('should return null for non-existent node', () => {
    const nodes = [createNode(1, 'root')]
    expect(findNodePath(nodes, 99)).toBeNull()
  })

  it('should return null for empty tree', () => {
    expect(findNodePath([], 1)).toBeNull()
  })

  it('should find node at any depth', () => {
    const nodes: FolderNode[] = [
      createNode(1, 'l1', [
        createNode(2, 'l2', [createNode(3, 'l3', [createNode(4, 'l4', [createNode(5, 'l5')])])]),
      ]),
    ]
    expect(findNodePath(nodes, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('should find first matching node when duplicates exist', () => {
    const nodes = [createNode(1, 'a', [createNode(2, 'b')]), createNode(2, 'b')]
    // Should find the first one (depth-first)
    expect(findNodePath(nodes, 2)).toEqual([1, 2])
  })
})

describe('findNodeName', () => {
  it('should find root node name', () => {
    const nodes = [createNode(1, 'Documents')]
    expect(findNodeName(nodes, 1)).toBe('Documents')
  })

  it('should find nested node name', () => {
    const nodes = [createNode(1, 'root', [createNode(2, 'child1', [createNode(3, 'grandchild')])])]
    expect(findNodeName(nodes, 3)).toBe('grandchild')
    expect(findNodeName(nodes, 2)).toBe('child1')
  })

  it('should return null for non-existent node', () => {
    const nodes = [createNode(1, 'root')]
    expect(findNodeName(nodes, 99)).toBeNull()
  })

  it('should handle empty tree', () => {
    expect(findNodeName([], 1)).toBeNull()
  })

  it('should handle nodes with empty children', () => {
    const nodes = [createNode(1, 'root', [])]
    expect(findNodeName(nodes, 1)).toBe('root')
  })
})
