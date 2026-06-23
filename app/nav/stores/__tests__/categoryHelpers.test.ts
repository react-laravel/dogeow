import { describe, it, expect } from 'vitest'
import {
  updateCategoryInList,
  removeCategoryFromList,
  addCategoryToList,
} from '../utils/categoryHelpers'
import type { NavCategory } from '@/app/nav/types'

const makeCategory = (overrides: Partial<NavCategory> = {}): NavCategory => ({
  id: 1,
  name: 'Category 1',
  icon: null,
  description: null,
  sort_order: 1,
  is_visible: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
  ...overrides,
})

describe('categoryHelpers', () => {
  describe('updateCategoryInList', () => {
    it('should update a category in the list', () => {
      const categories = [makeCategory({ id: 1 }), makeCategory({ id: 2, name: 'Cat 2' })]
      const updated = makeCategory({ id: 1, name: 'Updated' })

      const result = updateCategoryInList(categories, 1, updated)
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(updated)
      expect(result[1]).toEqual(categories[1])
    })

    it('should not modify original array', () => {
      const categories = [makeCategory({ id: 1 })]
      const updated = makeCategory({ id: 1, name: 'Updated' })
      updateCategoryInList(categories, 1, updated)
      expect(categories[0].name).toBe('Category 1')
    })

    it('should return unchanged list if id not found', () => {
      const categories = [makeCategory({ id: 1 })]
      const updated = makeCategory({ id: 99, name: 'Ghost' })
      const result = updateCategoryInList(categories, 99, updated)
      expect(result).toEqual(categories)
    })
  })

  describe('removeCategoryFromList', () => {
    it('should remove a category from the list', () => {
      const categories = [makeCategory({ id: 1 }), makeCategory({ id: 2 }), makeCategory({ id: 3 })]
      const result = removeCategoryFromList(categories, 2)
      expect(result).toHaveLength(2)
      expect(result.map(c => c.id)).toEqual([1, 3])
    })

    it('should not modify original array', () => {
      const categories = [makeCategory({ id: 1 }), makeCategory({ id: 2 })]
      removeCategoryFromList(categories, 1)
      expect(categories).toHaveLength(2)
    })

    it('should return unchanged list if id not found', () => {
      const categories = [makeCategory({ id: 1 })]
      const result = removeCategoryFromList(categories, 99)
      expect(result).toEqual(categories)
    })
  })

  describe('addCategoryToList', () => {
    it('should add a category to the end of the list', () => {
      const categories = [makeCategory({ id: 1 })]
      const newCat = makeCategory({ id: 2, name: 'New' })
      const result = addCategoryToList(categories, newCat)
      expect(result).toHaveLength(2)
      expect(result[1]).toEqual(newCat)
    })

    it('should not modify original array', () => {
      const categories = [makeCategory({ id: 1 })]
      const newCat = makeCategory({ id: 2 })
      addCategoryToList(categories, newCat)
      expect(categories).toHaveLength(1)
    })

    it('should work with empty list', () => {
      const newCat = makeCategory({ id: 1 })
      const result = addCategoryToList([], newCat)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(newCat)
    })
  })
})
