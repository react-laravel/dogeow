import { describe, expect, it } from 'vitest'
import { isEditorContentEmpty } from '../noteContentRenderer'

describe('isEditorContentEmpty', () => {
  it('returns true for undefined content', () => {
    expect(isEditorContentEmpty(undefined as unknown as Record<string, unknown>)).toBe(true)
  })

  it('returns true for content with empty array', () => {
    expect(isEditorContentEmpty({ content: [] })).toBe(true)
  })

  it('returns true for single empty paragraph', () => {
    expect(
      isEditorContentEmpty({
        content: [{ type: 'paragraph', content: [] }],
      })
    ).toBe(true)
  })

  it('returns true for single paragraph with single empty text', () => {
    expect(
      isEditorContentEmpty({
        content: [{ type: 'paragraph', content: [{ text: '' }] }],
      })
    ).toBe(true)
  })

  it('returns false for paragraph with non-empty text', () => {
    expect(
      isEditorContentEmpty({
        content: [{ type: 'paragraph', content: [{ text: 'Hello' }] }],
      })
    ).toBe(false)
  })

  it('returns false for multiple blocks', () => {
    expect(
      isEditorContentEmpty({
        content: [
          { type: 'paragraph', content: [{ text: 'Hello' }] },
          { type: 'paragraph', content: [{ text: 'World' }] },
        ],
      })
    ).toBe(false)
  })

  it('returns true for single paragraph with empty content property', () => {
    expect(
      isEditorContentEmpty({
        content: [{ type: 'paragraph' }],
      })
    ).toBe(true)
  })

  it('returns true when content is not provided', () => {
    expect(isEditorContentEmpty({})).toBe(true)
  })

  it('returns false for paragraph with multiple text spans including non-empty', () => {
    expect(
      isEditorContentEmpty({
        content: [{ type: 'paragraph', content: [{ text: '' }, { text: 'text' }] }],
      })
    ).toBe(false)
  })

  it('returns false for heading with content', () => {
    expect(
      isEditorContentEmpty({
        content: [{ type: 'heading', content: [{ text: 'Title' }] }],
      })
    ).toBe(false)
  })
})
