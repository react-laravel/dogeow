import { describe, it, expect } from 'vitest'
import {
  updateItemInList,
  removeItemFromList,
  addItemToList,
  updateItemInCategories,
  removeItemFromCategories,
  addItemToCategory,
  incrementItemClicks,
} from '../utils/itemHelpers'
import type { NavCategory, NavItem } from '@/app/nav/types'

const makeItem = (overrides: Partial<NavItem> = {}): NavItem => ({
  id: 1,
  nav_category_id: 1,
  name: 'Item 1',
  url: 'https://example.com',
  icon: null,
  description: null,
  sort_order: 1,
  is_visible: true,
  is_new_window: false,
  clicks: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
  ...overrides,
})

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

describe('itemHelpers', () => {
  describe('updateItemInList', () => {
    it('should update an item in the list', () => {
      const items = [makeItem({ id: 1 }), makeItem({ id: 2, name: 'Item 2' })]
      const updated = makeItem({ id: 1, name: 'Updated' })

      const result = updateItemInList(items, 1, updated)
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(updated)
      expect(result[1]).toEqual(items[1])
    })

    it('should not modify original array', () => {
      const items = [makeItem({ id: 1 })]
      const updated = makeItem({ id: 1, name: 'Updated' })
      updateItemInList(items, 1, updated)
      expect(items[0].name).toBe('Item 1')
    })
  })

  describe('removeItemFromList', () => {
    it('should remove an item from the list', () => {
      const items = [makeItem({ id: 1 }), makeItem({ id: 2 }), makeItem({ id: 3 })]
      const result = removeItemFromList(items, 2)
      expect(result).toHaveLength(2)
      expect(result.map(i => i.id)).toEqual([1, 3])
    })
  })

  describe('addItemToList', () => {
    it('should add an item to the end of the list', () => {
      const items = [makeItem({ id: 1 })]
      const newItem = makeItem({ id: 2, name: 'New' })
      const result = addItemToList(items, newItem)
      expect(result).toHaveLength(2)
      expect(result[1]).toEqual(newItem)
    })
  })

  describe('updateItemInCategories', () => {
    it('should update item inside categories', () => {
      const categories = [
        makeCategory({ id: 1, items: [makeItem({ id: 1 }), makeItem({ id: 2 })] }),
        makeCategory({ id: 2, items: [makeItem({ id: 3 })] }),
      ]
      const updated = makeItem({ id: 2, name: 'Updated' })

      const result = updateItemInCategories(categories, 2, updated)
      expect(result[0].items![1]).toEqual(updated)
      expect(result[1].items![0]).toEqual(makeItem({ id: 3 }))
    })

    it('should handle categories without items', () => {
      const categories = [makeCategory({ id: 1 })]
      const updated = makeItem({ id: 99 })
      const result = updateItemInCategories(categories, 99, updated)
      expect(result[0].items).toBeUndefined()
    })
  })

  describe('removeItemFromCategories', () => {
    it('should remove item from specified category', () => {
      const categories = [
        makeCategory({
          id: 1,
          items: [makeItem({ id: 1 }), makeItem({ id: 2 })],
          items_count: 2,
        }),
      ]

      const result = removeItemFromCategories(categories, 2, 1)
      expect(result[0].items).toHaveLength(1)
      expect(result[0].items_count).toBe(1)
    })

    it('should decrement items_count', () => {
      const categories = [
        makeCategory({
          id: 1,
          items: [makeItem({ id: 1 }), makeItem({ id: 2 })],
          items_count: 2,
        }),
      ]

      const result = removeItemFromCategories(categories, 1, 1)
      expect(result[0].items_count).toBe(1)
    })

    it('should not go below 0 for items_count', () => {
      const categories = [
        makeCategory({
          id: 1,
          items: [makeItem({ id: 1 })],
          items_count: 1,
        }),
      ]

      const result = removeItemFromCategories(categories, 1, 1)
      expect(result[0].items_count).toBe(0)
    })
  })

  describe('addItemToCategory', () => {
    it('should add item to matching category', () => {
      const categories = [
        makeCategory({ id: 1, items: [makeItem({ id: 1 })], items_count: 1 }),
        makeCategory({ id: 2 }),
      ]
      const newItem = makeItem({ id: 99, nav_category_id: 1 })

      const result = addItemToCategory(categories, newItem)
      expect(result[0].items).toHaveLength(2)
      expect(result[0].items_count).toBe(2)
      expect(result[1].items).toBeUndefined()
    })

    it('should increment items_count', () => {
      const categories = [makeCategory({ id: 1, items: [makeItem({ id: 1 })], items_count: 1 })]
      const newItem = makeItem({ id: 99, nav_category_id: 1 })

      const result = addItemToCategory(categories, newItem)
      expect(result[0].items_count).toBe(2)
    })
  })

  describe('incrementItemClicks', () => {
    it('should increment clicks for matching item', () => {
      const categories = [
        makeCategory({
          id: 1,
          items: [makeItem({ id: 1, clicks: 5 }), makeItem({ id: 2, clicks: 3 })],
        }),
      ]

      const result = incrementItemClicks(categories, 1)
      expect(result[0].items![0].clicks).toBe(6)
      expect(result[0].items![1].clicks).toBe(3)
    })

    it('should handle items with undefined clicks', () => {
      const categories = [
        makeCategory({
          id: 1,
          items: [makeItem({ id: 1, clicks: undefined })],
        }),
      ]

      const result = incrementItemClicks(categories, 1)
      expect(result[0].items![0].clicks).toBe(1)
    })

    it('should not modify categories without items', () => {
      const categories = [makeCategory({ id: 1 })]
      const result = incrementItemClicks(categories, 1)
      expect(result[0].items).toBeUndefined()
    })
  })
})
