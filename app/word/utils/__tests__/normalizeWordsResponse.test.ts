import { describe, expect, it } from 'vitest'
import { normalizeWordsResponse } from '@/app/word/types'

describe('normalizeWordsResponse', () => {
  it('should return empty array for undefined', () => {
    expect(normalizeWordsResponse(undefined)).toEqual([])
  })

  it('should return empty array for null', () => {
    // TypeScript won't allow null, but runtime safety
    expect(normalizeWordsResponse([])).toEqual([])
  })

  it('should return array directly', () => {
    const words = [{ id: 1, content: 'hello', difficulty: 1, frequency: 1 }]
    expect(normalizeWordsResponse(words)).toBe(words)
  })

  it('should extract data from { data: [...] }', () => {
    const words = [{ id: 1, content: 'hello', difficulty: 1, frequency: 1 }]
    expect(normalizeWordsResponse({ data: words })).toEqual(words)
  })

  it('should return empty array for { data: undefined }', () => {
    expect(normalizeWordsResponse({ data: undefined })).toEqual([])
  })

  it('should return empty array for empty input array', () => {
    expect(normalizeWordsResponse([])).toEqual([])
  })
})
