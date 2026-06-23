import { describe, it, expect } from 'vitest'
import { PREVIEW_TYPES, type PreviewType } from '../previewTypes'

describe('PREVIEW_TYPES', () => {
  it('should have all expected preview types', () => {
    expect(PREVIEW_TYPES.LOADING).toBe('loading')
    expect(PREVIEW_TYPES.IMAGE).toBe('image')
    expect(PREVIEW_TYPES.PDF).toBe('pdf')
    expect(PREVIEW_TYPES.TEXT).toBe('text')
    expect(PREVIEW_TYPES.DOCUMENT).toBe('document')
    expect(PREVIEW_TYPES.UNKNOWN).toBe('unknown')
  })

  it('should have 6 preview types', () => {
    const keys = Object.keys(PREVIEW_TYPES)
    expect(keys).toHaveLength(6)
  })

  it('should be readonly', () => {
    // Type check: all values should be string literals
    const types: PreviewType[] = Object.values(PREVIEW_TYPES)
    expect(types.every(t => typeof t === 'string')).toBe(true)
  })
})
