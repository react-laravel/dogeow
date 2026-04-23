import { describe, expect, it } from 'vitest'
import { getContentPreview, getNotePreviewText } from '../noteUtils'
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
  describe('getContentPreview', () => {
    it('should preserve ordinary hyphens in plain text content', () => {
      expect(getContentPreview('版本 2.0 - 正式版')).toBe('版本 2.0 - 正式版')
    })

    it('should strip markdown list markers without removing sentence hyphens', () => {
      expect(getContentPreview('- 列表项')).toBe('列表项')
    })

    it('should strip markdown horizontal rules', () => {
      expect(getContentPreview('---')).toBe('')
    })

    it('should strip blockquote list markers', () => {
      expect(getContentPreview('> - 列表项')).toBe('列表项')
    })

    it('should strip blockquote horizontal rules', () => {
      expect(getContentPreview('> ---')).toBe('')
    })
  })

  describe('getNotePreviewText', () => {
    it('should preserve ordinary hyphens when previewing markdown content', () => {
      const note = createNote({ content_markdown: '版本 2.0 - 正式版' })

      expect(getNotePreviewText(note)).toBe('版本 2.0 - 正式版')
    })
  })
})
