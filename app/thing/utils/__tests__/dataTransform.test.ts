import { describe, expect, it } from 'vitest'
import {
  convertImagesToUploadedFormat,
  buildLocationPath,
  hasDataChanged,
  tagsToIdStrings,
} from '../dataTransform'
import type { ItemImage, Tag } from '@/app/thing/types'

describe('dataTransform', () => {
  describe('convertImagesToUploadedFormat', () => {
    it('should convert images with all fields', () => {
      const images: ItemImage[] = [
        {
          id: 1,
          path: 'uploads/1/a.jpg',
          thumbnail_path: 'uploads/1/a-thumb.jpg',
          url: 'https://example.com/full.jpg',
          thumbnail_url: 'https://example.com/thumb.jpg',
        },
      ]

      const result = convertImagesToUploadedFormat(images)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 1,
        path: 'uploads/1/a.jpg',
        thumbnail_path: 'uploads/1/a-thumb.jpg',
        url: 'https://example.com/full.jpg',
        thumbnail_url: 'https://example.com/thumb.jpg',
      })
    })

    it('should handle null fields with empty string fallback', () => {
      const images: ItemImage[] = [
        {
          id: 1,
          path: null,
          thumbnail_path: null,
          url: null,
          thumbnail_url: null,
        },
      ]

      const result = convertImagesToUploadedFormat(images)

      expect(result[0].path).toBe('')
      expect(result[0].thumbnail_path).toBe('')
      expect(result[0].url).toBe('')
      expect(result[0].thumbnail_url).toBe('')
      expect(result[0].id).toBe(1)
    })

    it('should handle mixed null and non-null fields', () => {
      const images: ItemImage[] = [
        {
          id: 1,
          path: 'uploads/1/a.jpg',
          thumbnail_path: null,
          url: 'https://example.com/full.jpg',
          thumbnail_url: null,
        },
      ]

      const result = convertImagesToUploadedFormat(images)

      expect(result[0].path).toBe('uploads/1/a.jpg')
      expect(result[0].thumbnail_path).toBe('')
      expect(result[0].url).toBe('https://example.com/full.jpg')
      expect(result[0].thumbnail_url).toBe('')
    })

    it('should return empty array for empty input', () => {
      expect(convertImagesToUploadedFormat([])).toEqual([])
    })

    it('should convert multiple images', () => {
      const images: ItemImage[] = [
        {
          id: 1,
          path: 'a.jpg',
          thumbnail_path: 'a-thumb.jpg',
          url: 'full-a.jpg',
          thumbnail_url: 'thumb-a.jpg',
        },
        {
          id: 2,
          path: 'b.jpg',
          thumbnail_path: 'b-thumb.jpg',
          url: 'full-b.jpg',
          thumbnail_url: 'thumb-b.jpg',
        },
      ]

      const result = convertImagesToUploadedFormat(images)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(1)
      expect(result[1].id).toBe(2)
    })
  })

  describe('buildLocationPath', () => {
    it('should build path with all parts', () => {
      expect(buildLocationPath('Kitchen', 'Cabinet', 'Shelf A')).toBe('Kitchen / Cabinet / Shelf A')
    })

    it('should build path with two parts', () => {
      expect(buildLocationPath('Kitchen', 'Cabinet')).toBe('Kitchen / Cabinet')
    })

    it('should build path with one part', () => {
      expect(buildLocationPath('Kitchen')).toBe('Kitchen')
    })

    it('should return empty string for no parts', () => {
      expect(buildLocationPath()).toBe('')
    })

    it('should skip falsy values', () => {
      expect(buildLocationPath('Kitchen', undefined, 'Shelf A')).toBe('Kitchen / Shelf A')
      expect(buildLocationPath('Kitchen', null, 'Shelf A')).toBe('Kitchen / Shelf A')
      expect(buildLocationPath('Kitchen', '', 'Shelf A')).toBe('Kitchen / Shelf A')
    })
  })

  describe('hasDataChanged', () => {
    it('should return false for same primitive values', () => {
      expect(hasDataChanged('hello', 'hello')).toBe(false)
      expect(hasDataChanged(42, 42)).toBe(false)
      expect(hasDataChanged(true, true)).toBe(false)
    })

    it('should return true for different primitive values', () => {
      expect(hasDataChanged('hello', 'world')).toBe(true)
      expect(hasDataChanged(42, 43)).toBe(true)
    })

    it('should treat null and undefined as different values', () => {
      // deepEqual uses === for null/undefined check, so null !== undefined
      expect(hasDataChanged(null, null)).toBe(false)
      expect(hasDataChanged(undefined, undefined)).toBe(false)
      expect(hasDataChanged(null, undefined)).toBe(true)
      expect(hasDataChanged(undefined, null)).toBe(true)
    })

    it('should detect object changes', () => {
      expect(hasDataChanged({ a: 1 }, { a: 1 })).toBe(false)
      expect(hasDataChanged({ a: 1 }, { a: 2 })).toBe(true)
    })

    it('should detect array changes', () => {
      expect(hasDataChanged([1, 2, 3], [1, 2, 3])).toBe(false)
      expect(hasDataChanged([1, 2, 3], [1, 2, 4])).toBe(true)
      expect(hasDataChanged([1, 2], [1, 2, 3])).toBe(true)
    })

    it('should detect nested object changes', () => {
      expect(hasDataChanged({ a: { b: 1 } }, { a: { b: 1 } })).toBe(false)
      expect(hasDataChanged({ a: { b: 1 } }, { a: { b: 2 } })).toBe(true)
    })

    it('should handle Date objects', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-01')
      const date3 = new Date('2024-01-02')

      expect(hasDataChanged(date1, date2)).toBe(false)
      expect(hasDataChanged(date1, date3)).toBe(true)
    })

    it('should handle mixed types', () => {
      expect(hasDataChanged({ a: 1 }, [1])).toBe(true)
      expect(hasDataChanged('hello', 42)).toBe(true)
    })
  })

  describe('tagsToIdStrings', () => {
    it('should convert tags to string IDs', () => {
      const tags: Tag[] = [
        { id: 1, name: 'Tag1' },
        { id: 2, name: 'Tag2' },
        { id: 3, name: 'Tag3' },
      ]

      const result = tagsToIdStrings(tags)

      expect(result).toEqual(['1', '2', '3'])
    })

    it('should return empty array for empty input', () => {
      expect(tagsToIdStrings([])).toEqual([])
    })

    it('should handle single tag', () => {
      const tags: Tag[] = [{ id: 42, name: 'Single' }]

      expect(tagsToIdStrings(tags)).toEqual(['42'])
    })
  })
})
