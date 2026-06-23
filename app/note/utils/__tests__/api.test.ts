import { describe, expect, it } from 'vitest'
import { normalizeNotes, normalizeNote } from '../api'

describe('api utils', () => {
  describe('normalizeNotes', () => {
    it('should return array directly when data is already an array', () => {
      const notes = [
        { id: 1, title: 'Note 1' },
        { id: 2, title: 'Note 2' },
      ]
      const result = normalizeNotes<{ id: number; title: string }>(notes)
      expect(result).toEqual(notes)
    })

    it('should extract notes from object with notes property', () => {
      const data = {
        notes: [
          { id: 1, title: 'Note 1' },
          { id: 2, title: 'Note 2' },
        ],
      }
      const result = normalizeNotes<{ id: number; title: string }>(data)
      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Note 1')
    })

    it('should return empty array when notes property is not an array', () => {
      const data = { notes: 'not an array' }
      const result = normalizeNotes<{ id: number }>(data)
      expect(result).toEqual([])
    })

    it('should return empty array when data is null', () => {
      const result = normalizeNotes(null as unknown as never)
      expect(result).toEqual([])
    })

    it('should return empty array when data is undefined', () => {
      const result = normalizeNotes(undefined as unknown as never)
      expect(result).toEqual([])
    })

    it('should return empty array when data is a primitive', () => {
      expect(normalizeNotes('string')).toEqual([])
      expect(normalizeNotes(123)).toEqual([])
      expect(normalizeNotes(true)).toEqual([])
    })

    it('should return empty array when object has no notes property', () => {
      const data = { other: 'value' }
      const result = normalizeNotes<{ id: number }>(data)
      expect(result).toEqual([])
    })

    it('should return empty array when notes property is undefined', () => {
      const data = { notes: undefined }
      const result = normalizeNotes<{ id: number }>(data)
      expect(result).toEqual([])
    })
  })

  describe('normalizeNote', () => {
    it('should return null when data is null', () => {
      expect(normalizeNote(null)).toBeNull()
    })

    it('should return null when data is undefined', () => {
      expect(normalizeNote(undefined)).toBeNull()
    })

    it('should extract note from object with note property', () => {
      const note = { id: 1, title: 'Test Note' }
      const data = { note }
      const result = normalizeNote<{ id: number; title: string }>(data)
      expect(result).toEqual(note)
    })

    it('should return null when note property is undefined', () => {
      const data = { note: undefined }
      const result = normalizeNote<{ id: number }>(data)
      expect(result).toBeNull()
    })

    it('should return data as-is when no note property exists', () => {
      const note = { id: 1, title: 'Test Note' }
      const result = normalizeNote<{ id: number; title: string }>(note)
      expect(result).toEqual(note)
    })

    it('should handle object with null note property', () => {
      const data = { note: null }
      const result = normalizeNote<{ id: number }>(data)
      expect(result).toBeNull()
    })
  })
})
