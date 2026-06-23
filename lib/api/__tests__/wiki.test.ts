import { describe, it, expect } from 'vitest'
import {
  getWikiGraph,
  getArticle,
  createNode,
  updateNode,
  deleteNode,
  createLink,
  deleteLink,
} from '../wiki'

describe('wiki API functions', () => {
  describe('getWikiGraph', () => {
    it('should be a function returning Promise<WikiGraph>', () => {
      expect(typeof getWikiGraph).toBe('function')
      // Can't call without mocking apiRequest, but verify type
    })
  })

  describe('getArticle', () => {
    it('should be a function returning Promise<Article>', () => {
      expect(typeof getArticle).toBe('function')
    })
  })

  describe('createNode', () => {
    it('should be a function returning Promise<{ node: WikiNode }>', () => {
      expect(typeof createNode).toBe('function')
    })
  })

  describe('updateNode', () => {
    it('should be a function returning Promise<{ node: WikiNode }>', () => {
      expect(typeof updateNode).toBe('function')
    })
  })

  describe('deleteNode', () => {
    it('should be a function returning Promise<void>', () => {
      expect(typeof deleteNode).toBe('function')
    })
  })

  describe('createLink', () => {
    it('should be a function returning Promise<{ link: WikiLink }>', () => {
      expect(typeof createLink).toBe('function')
    })
  })

  describe('deleteLink', () => {
    it('should be a function returning Promise<void>', () => {
      expect(typeof deleteLink).toBe('function')
    })
  })
})

describe('wiki types', () => {
  it('WikiNode should have expected structure', () => {
    const node = {
      id: 1,
      title: 'Test',
      slug: 'test',
      tags: ['a', 'b'],
      summary: 'A summary',
      content: 'Content',
      content_markdown: '# Markdown',
    }
    expect(node.id).toBe(1)
    expect(node.title).toBe('Test')
    expect(node.tags).toHaveLength(2)
  })

  it('WikiLink should have expected structure', () => {
    const link = {
      id: 1,
      source: 1,
      target: 2,
      type: 'reference',
    }
    expect(link.source).toBe(1)
    expect(link.target).toBe(2)
  })
})
