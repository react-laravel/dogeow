import { describe, expect, it } from 'vitest'
import { LIGHT_FALLBACK, DARK_FALLBACK, withAlpha, nodeDataToWikiNode } from '../themeUtils'

describe('themeUtils', () => {
  describe('LIGHT_FALLBACK', () => {
    it('has all required color properties', () => {
      expect(LIGHT_FALLBACK.background).toBeDefined()
      expect(LIGHT_FALLBACK.foreground).toBeDefined()
      expect(LIGHT_FALLBACK.card).toBeDefined()
      expect(LIGHT_FALLBACK.cardForeground).toBeDefined()
      expect(LIGHT_FALLBACK.mutedForeground).toBeDefined()
      expect(LIGHT_FALLBACK.border).toBeDefined()
      expect(LIGHT_FALLBACK.primary).toBeDefined()
      expect(LIGHT_FALLBACK.ring).toBeDefined()
      expect(LIGHT_FALLBACK.accent).toBeDefined()
    })

    it('has correct background color', () => {
      expect(LIGHT_FALLBACK.background).toBe('#ffffff')
    })

    it('has hex color values', () => {
      expect(LIGHT_FALLBACK.primary).toMatch(/^#/)
      expect(LIGHT_FALLBACK.border).toMatch(/^#/)
    })
  })

  describe('DARK_FALLBACK', () => {
    it('has all required color properties', () => {
      expect(DARK_FALLBACK.background).toBeDefined()
      expect(DARK_FALLBACK.foreground).toBeDefined()
      expect(DARK_FALLBACK.card).toBeDefined()
    })

    it('has dark background color', () => {
      expect(DARK_FALLBACK.background).toBe('#0b0b0b')
    })

    it('has different foreground from light fallback', () => {
      expect(DARK_FALLBACK.foreground).not.toBe(LIGHT_FALLBACK.foreground)
    })
  })

  describe('withAlpha', () => {
    it('returns fallback for empty string', () => {
      expect(withAlpha('', 0.5, '#000000')).toBe('#000000')
    })

    it('returns fallback for whitespace-only string', () => {
      expect(withAlpha('   ', 0.5, '#000000')).toBe('#000000')
    })

    it('converts hex color to rgba', () => {
      expect(withAlpha('#ff0000', 0.5, '#000000')).toBe('rgba(255, 0, 0, 0.5)')
    })

    it('converts short hex color to rgba', () => {
      expect(withAlpha('#f00', 0.5, '#000000')).toBe('rgba(255, 0, 0, 0.5)')
    })

    it('converts rgb function to rgba', () => {
      expect(withAlpha('rgb(255, 128, 0)', 0.5, '#000000')).toBe('rgba(255, 128, 0, 0.5)')
    })

    it('converts rgba function to rgba with new alpha', () => {
      expect(withAlpha('rgba(255, 128, 0, 0.8)', 0.3, '#000000')).toBe('rgba(255, 128, 0, 0.3)')
    })

    it('handles 8-digit hex (with alpha)', () => {
      expect(withAlpha('#ff000080', 0.5, '#000000')).toBe('rgba(255, 0, 0, 0.5)')
    })

    it('returns fallback for unrecognized format', () => {
      expect(withAlpha('not-a-color', 0.5, '#000000')).toBe('#000000')
    })
  })

  describe('nodeDataToWikiNode', () => {
    it('converts basic node data', () => {
      const result = nodeDataToWikiNode({
        id: '42',
        title: 'Test Node',
        slug: 'test-node',
      })

      expect(result.id).toBe(42)
      expect(result.title).toBe('Test Node')
      expect(result.slug).toBe('test-node')
    })

    it('converts numeric id', () => {
      const result = nodeDataToWikiNode({
        id: 123,
        title: 'Node',
        slug: 'node',
      })

      expect(result.id).toBe(123)
    })

    it('preserves tags and summary', () => {
      const result = nodeDataToWikiNode({
        id: '1',
        title: 'Node',
        slug: 'node',
        tags: ['tag1', 'tag2'],
        summary: 'A summary',
      })

      expect(result.tags).toEqual(['tag1', 'tag2'])
      expect(result.summary).toBe('A summary')
    })

    it('defaults slug to empty string when undefined', () => {
      const result = nodeDataToWikiNode({
        id: '1',
        title: 'Node',
      })

      expect(result.slug).toBe('')
    })
  })
})
