import { describe, expect, it, vi } from 'vitest'
import { getContentPreview, getNotePreviewText, formatDate, hasNoteContent } from '../noteUtils'
import type { Note } from '../../types/note'

const createNote = (overrides: Partial<Note> = {}): Note => ({
  id: 1,
  title: '测试笔记',
  content: '',
  content_markdown: '',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  is_draft: false,
  ...overrides,
})

describe('noteUtils', () => {
  describe('formatDate', () => {
    it('should format a valid date string', () => {
      // date-fns with zhCN locale formats in local timezone
      const result = formatDate('2024-01-15T10:30:00Z')
      expect(result).toContain('2024年01月15日')
      expect(result).toContain(':')
    })

    it('should return original string for invalid date', () => {
      const invalidDate = 'not-a-date'
      expect(formatDate(invalidDate)).toBe(invalidDate)
    })

    it('should return original string for empty string', () => {
      expect(formatDate('')).toBe('')
    })
  })

  describe('getContentPreview', () => {
    it('should return empty string for empty content', () => {
      expect(getContentPreview('')).toBe('')
    })

    it('should return empty string for null/undefined content', () => {
      expect(getContentPreview(null as unknown as string)).toBe('')
      expect(getContentPreview(undefined as unknown as string)).toBe('')
    })

    it('should strip HTML tags', () => {
      expect(getContentPreview('<p>Hello <strong>world</strong></p>')).toBe('Hello world')
    })

    it('should strip blockquote markers', () => {
      expect(getContentPreview('> quoted text')).toBe('quoted text')
    })

    it('should strip markdown list markers', () => {
      expect(getContentPreview('- item 1\n- item 2')).toBe('item 1\nitem 2')
    })

    it('should strip markdown horizontal rules (replaces with empty string, leaving extra newline)', () => {
      // The regex /^\s*(?:[-*_]\s*){3,}$/gm replaces --- with empty string
      // leaving the surrounding newlines intact
      const result = getContentPreview('text\n---\nmore text')
      expect(result).not.toContain('---')
      expect(result).toContain('text')
      expect(result).toContain('more text')
    })

    it('should strip markdown heading markers', () => {
      expect(getContentPreview('# Heading')).toBe('Heading')
    })

    it('should strip inline code markers', () => {
      expect(getContentPreview('use `code` here')).toBe('use code here')
    })

    it('should preserve ordinary hyphens in text', () => {
      expect(getContentPreview('版本 2.0 - 正式版')).toBe('版本 2.0 - 正式版')
    })

    it('should truncate long content', () => {
      const longContent = 'a'.repeat(200)
      const preview = getContentPreview(longContent, 50)
      expect(preview.length).toBeLessThanOrEqual(53) // 50 + '...'
      expect(preview.endsWith('...')).toBe(true)
    })

    it('should not truncate short content', () => {
      const shortContent = 'Hello world'
      expect(getContentPreview(shortContent)).toBe('Hello world')
    })

    it('should trim whitespace', () => {
      expect(getContentPreview('  hello  ')).toBe('hello')
    })

    it('should use default max length of 150', () => {
      const content = 'a'.repeat(200)
      const preview = getContentPreview(content)
      expect(preview.length).toBeLessThanOrEqual(153)
    })
  })

  describe('getNotePreviewText', () => {
    it('should return empty string for note with no content', () => {
      const note = createNote()
      expect(getNotePreviewText(note)).toBe('')
    })

    it('should use content_markdown when available', () => {
      const note = createNote({ content_markdown: '# Hello World' })
      expect(getNotePreviewText(note)).toBe('Hello World')
    })

    it('should parse JSON content', () => {
      const note = createNote({
        content: JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Hello JSON' }],
            },
          ],
        }),
      })
      expect(getNotePreviewText(note)).toBe('Hello JSON')
    })

    it('should handle note with only content_markdown', () => {
      const note = createNote({
        content_markdown: 'This is markdown content',
        content: '',
      })
      expect(getNotePreviewText(note)).toBe('This is markdown content')
    })

    it('should truncate long markdown content', () => {
      const longMarkdown = 'a'.repeat(200)
      const note = createNote({ content_markdown: longMarkdown })
      const preview = getNotePreviewText(note, 50)
      expect(preview.length).toBeLessThanOrEqual(53)
    })

    it('should handle plain text content (non-JSON)', () => {
      const note = createNote({ content: 'Plain text content here' })
      expect(getNotePreviewText(note)).toBe('Plain text content here')
    })

    it('should return empty for whitespace-only content', () => {
      const note = createNote({ content: '   ' })
      expect(getNotePreviewText(note)).toBe('')
    })
  })

  describe('hasNoteContent', () => {
    it('should return true for note with markdown content', () => {
      const note = createNote({ content_markdown: '# Title' })
      expect(hasNoteContent(note)).toBe(true)
    })

    it('should return true for note with JSON content that has text', () => {
      const note = createNote({
        content: JSON.stringify({
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'text' }] }],
        }),
      })
      expect(hasNoteContent(note)).toBe(true)
    })

    it('should return true for note with plain text content', () => {
      const note = createNote({ content: 'Some text content' })
      expect(hasNoteContent(note)).toBe(true)
    })

    it('should return false for note with no content', () => {
      const note = createNote({ content: '', content_markdown: '' })
      expect(hasNoteContent(note)).toBe(false)
    })

    it('should return false for note with whitespace-only content', () => {
      const note = createNote({ content: '   ', content_markdown: '' })
      expect(hasNoteContent(note)).toBe(false)
    })

    it('should return false for note with JSON content that has no text nodes', () => {
      const note = createNote({
        content: '{"type": "not-doc", "content": "text"}',
      })
      // extractTextFromJSON only extracts text from nodes with type === 'text'
      expect(hasNoteContent(note)).toBe(false)
    })

    it('should handle content with paragraphs', () => {
      const note = createNote({
        content: JSON.stringify({
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Para 1' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Para 2' }] },
          ],
        }),
      })
      expect(hasNoteContent(note)).toBe(true)
    })

    it('should handle empty JSON content', () => {
      const note = createNote({ content: '{"type":"doc","content":[]}' })
      expect(hasNoteContent(note)).toBe(false)
    })
  })
})
