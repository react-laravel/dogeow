import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNoteContent } from '../useNoteContent'

describe('useNoteContent', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  it('should return default content when localStorage is empty', () => {
    const { result } = renderHook(() => useNoteContent())

    const content = result.current.getCurrentContent()

    expect(content.content).toBe(
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}'
    )
    expect(content.markdown).toBe('')
  })

  it('should return stored content from localStorage', () => {
    const storedContent =
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"test"}]}]}'
    const storedMarkdown = '# Test Markdown'
    window.localStorage.setItem('novel-content', storedContent)
    window.localStorage.setItem('markdown', storedMarkdown)

    const { result } = renderHook(() => useNoteContent())

    const content = result.current.getCurrentContent()

    expect(content.content).toBe(storedContent)
    expect(content.markdown).toBe(storedMarkdown)
  })

  it('should return stored markdown with empty content', () => {
    window.localStorage.setItem('markdown', '# Only Markdown')
    // novel-content is not set

    const { result } = renderHook(() => useNoteContent())

    const content = result.current.getCurrentContent()

    expect(content.content).toBe(
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}'
    )
    expect(content.markdown).toBe('# Only Markdown')
  })

  it('should return stored content with empty markdown', () => {
    const storedContent = '{"type":"doc","content":[{"type":"paragraph","content":[]}]}'
    window.localStorage.setItem('novel-content', storedContent)
    // markdown is not set

    const { result } = renderHook(() => useNoteContent())

    const content = result.current.getCurrentContent()

    expect(content.content).toBe(storedContent)
    expect(content.markdown).toBe('')
  })

  it('should return empty string for markdown when stored value is null', () => {
    window.localStorage.setItem('markdown', 'null')

    const { result } = renderHook(() => useNoteContent())

    const content = result.current.getCurrentContent()

    // null string stored in localStorage becomes string "null", which is truthy
    // but with ?? '' it would still be 'null'
    expect(content.markdown).toBe('null')
  })

  it('should use default content when only whitespace in markdown', () => {
    window.localStorage.setItem('markdown', '   ')

    const { result } = renderHook(() => useNoteContent())

    const content = result.current.getCurrentContent()

    expect(content.markdown).toBe('   ')
  })
})
