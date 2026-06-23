import { describe, expect, it, vi } from 'vitest'
import { isValidNovelJson, DEFAULT_NOVEL_CONTENT } from '../noteValidation'

describe('noteValidation', () => {
  describe('isValidNovelJson', () => {
    it('should return true for valid novel JSON', () => {
      const validJson = '{"type":"doc","content":[{"type":"paragraph","content":[]}]}'
      expect(isValidNovelJson(validJson)).toBe(true)
    })

    it('should return true for valid novel JSON with content', () => {
      const validJson =
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"hello"}]}]}'
      expect(isValidNovelJson(validJson)).toBe(true)
    })

    it('should return false for invalid JSON string', () => {
      expect(isValidNovelJson('not json')).toBe(false)
    })

    it('should return false for JSON that is not an object', () => {
      expect(isValidNovelJson('"string"')).toBe(false)
      expect(isValidNovelJson('[1, 2, 3]')).toBe(false)
      expect(isValidNovelJson('123')).toBe(false)
      expect(isValidNovelJson('true')).toBe(false)
    })

    it('should return false for object without type property', () => {
      expect(isValidNovelJson('{"content":[]}')).toBe(false)
    })

    it('should return false for object with non-doc type', () => {
      expect(isValidNovelJson('{"type":"text","content":[]}')).toBe(false)
    })

    it('should return false for object with doc type but no content array', () => {
      expect(isValidNovelJson('{"type":"doc"}')).toBe(false)
    })

    it('should return false for object with doc type but content is not array', () => {
      expect(isValidNovelJson('{"type":"doc","content":"not array"}')).toBe(false)
      expect(isValidNovelJson('{"type":"doc","content":{}}')).toBe(false)
    })

    it('should return true for doc type with empty content array', () => {
      expect(isValidNovelJson('{"type":"doc","content":[]}')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isValidNovelJson('')).toBe(false)
    })

    it('should handle malformed JSON gracefully', () => {
      expect(isValidNovelJson('{"type":"doc","content":[}')).toBe(false)
      expect(isValidNovelJson('{invalid json')).toBe(false)
    })
  })

  describe('DEFAULT_NOVEL_CONTENT', () => {
    it('should be a valid novel JSON string', () => {
      expect(isValidNovelJson(DEFAULT_NOVEL_CONTENT)).toBe(true)
    })

    it('should have doc type with empty paragraph content', () => {
      const parsed = JSON.parse(DEFAULT_NOVEL_CONTENT)
      expect(parsed.type).toBe('doc')
      expect(parsed.content).toEqual([{ type: 'paragraph', content: [] }])
    })
  })
})
