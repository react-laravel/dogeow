import { describe, it, expect } from 'vitest'
import { getSampleCategories, getSampleItems, combineCategoriesWithItems } from '../sampleData'
import type { NavCategory, NavItem } from '@/app/nav/types'

describe('sampleData', () => {
  describe('getSampleCategories', () => {
    it('should return 3 sample categories', () => {
      const categories = getSampleCategories()
      expect(categories).toHaveLength(3)
    })

    it('should have correct category properties', () => {
      const categories = getSampleCategories()
      categories.forEach(cat => {
        expect(cat).toHaveProperty('id')
        expect(cat).toHaveProperty('name')
        expect(cat).toHaveProperty('icon')
        expect(cat).toHaveProperty('description')
        expect(cat).toHaveProperty('sort_order')
        expect(cat).toHaveProperty('is_visible')
        expect(cat).toHaveProperty('created_at')
        expect(cat).toHaveProperty('updated_at')
        expect(cat).toHaveProperty('deleted_at')
        expect(typeof cat.id).toBe('number')
        expect(typeof cat.name).toBe('string')
        expect(typeof cat.is_visible).toBe('boolean')
      })
    })

    it('should have unique category ids', () => {
      const categories = getSampleCategories()
      const ids = categories.map(c => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have incremental sort_order', () => {
      const categories = getSampleCategories()
      const sortOrders = categories.map(c => c.sort_order)
      expect(sortOrders).toEqual([1, 2, 3])
    })

    it('should have correct first category name', () => {
      const categories = getSampleCategories()
      expect(categories[0].name).toBe('常用')
    })
  })

  describe('getSampleItems', () => {
    it('should return sample items', () => {
      const items = getSampleItems()
      expect(items.length).toBeGreaterThan(0)
    })

    it('should have correct item properties', () => {
      const items = getSampleItems()
      items.forEach(item => {
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('nav_category_id')
        expect(item).toHaveProperty('name')
        expect(item).toHaveProperty('url')
        expect(item).toHaveProperty('sort_order')
        expect(item).toHaveProperty('is_visible')
        expect(item).toHaveProperty('is_new_window')
        expect(item).toHaveProperty('clicks')
        expect(typeof item.id).toBe('number')
        expect(typeof item.url).toBe('string')
        expect(typeof item.is_new_window).toBe('boolean')
      })
    })

    it('should have valid URLs', () => {
      const items = getSampleItems()
      items.forEach(item => {
        expect(item.url).toMatch(/^https?:\/\//)
      })
    })

    it('should have unique item ids', () => {
      const items = getSampleItems()
      const ids = items.map(i => i.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('combineCategoriesWithItems', () => {
    it('should combine categories with matching items', () => {
      const categories: NavCategory[] = [
        {
          id: 1,
          name: 'Cat1',
          icon: null,
          description: null,
          sort_order: 1,
          is_visible: true,
          created_at: '',
          updated_at: '',
          deleted_at: null,
        },
        {
          id: 2,
          name: 'Cat2',
          icon: null,
          description: null,
          sort_order: 2,
          is_visible: true,
          created_at: '',
          updated_at: '',
          deleted_at: null,
        },
      ]
      const items: NavItem[] = [
        {
          id: 1,
          nav_category_id: 1,
          name: 'Item1',
          url: 'https://a.com',
          icon: null,
          description: null,
          sort_order: 1,
          is_visible: true,
          is_new_window: false,
          clicks: 0,
          created_at: '',
          updated_at: '',
          deleted_at: null,
        },
        {
          id: 2,
          nav_category_id: 1,
          name: 'Item2',
          url: 'https://b.com',
          icon: null,
          description: null,
          sort_order: 2,
          is_visible: true,
          is_new_window: false,
          clicks: 0,
          created_at: '',
          updated_at: '',
          deleted_at: null,
        },
        {
          id: 3,
          nav_category_id: 2,
          name: 'Item3',
          url: 'https://c.com',
          icon: null,
          description: null,
          sort_order: 1,
          is_visible: true,
          is_new_window: false,
          clicks: 0,
          created_at: '',
          updated_at: '',
          deleted_at: null,
        },
      ]

      const result = combineCategoriesWithItems(categories, items)

      expect(result).toHaveLength(2)
      expect(result[0].items).toHaveLength(2)
      expect(result[0].items?.[0].id).toBe(1)
      expect(result[1].items).toHaveLength(1)
      expect(result[1].items?.[0].id).toBe(3)
    })

    it('should add items_count to each category', () => {
      const categories: NavCategory[] = [
        {
          id: 1,
          name: 'Cat1',
          icon: null,
          description: null,
          sort_order: 1,
          is_visible: true,
          created_at: '',
          updated_at: '',
          deleted_at: null,
        },
      ]
      const items: NavItem[] = [
        {
          id: 1,
          nav_category_id: 1,
          name: 'Item1',
          url: 'https://a.com',
          icon: null,
          description: null,
          sort_order: 1,
          is_visible: true,
          is_new_window: false,
          clicks: 0,
          created_at: '',
          updated_at: '',
          deleted_at: null,
        },
      ]

      const result = combineCategoriesWithItems(categories, items)

      expect(result[0].items_count).toBe(1)
    })

    it('should set items_count to 0 for empty categories', () => {
      const categories: NavCategory[] = [
        {
          id: 1,
          name: 'Cat1',
          icon: null,
          description: null,
          sort_order: 1,
          is_visible: true,
          created_at: '',
          updated_at: '',
          deleted_at: null,
        },
      ]
      const items: NavItem[] = []

      const result = combineCategoriesWithItems(categories, items)

      expect(result[0].items_count).toBe(0)
      expect(result[0].items).toEqual([])
    })

    it('should not modify original arrays', () => {
      const categories: NavCategory[] = [
        {
          id: 1,
          name: 'Cat1',
          icon: null,
          description: null,
          sort_order: 1,
          is_visible: true,
          created_at: '',
          updated_at: '',
          deleted_at: null,
        },
      ]
      const items: NavItem[] = [
        {
          id: 1,
          nav_category_id: 1,
          name: 'Item1',
          url: 'https://a.com',
          icon: null,
          description: null,
          sort_order: 1,
          is_visible: true,
          is_new_window: false,
          clicks: 0,
          created_at: '',
          updated_at: '',
          deleted_at: null,
        },
      ]

      combineCategoriesWithItems(categories, items)

      expect(categories[0]).not.toHaveProperty('items')
      expect(categories[0]).not.toHaveProperty('items_count')
    })

    it('should handle empty categories array', () => {
      const result = combineCategoriesWithItems([], [])
      expect(result).toEqual([])
    })
  })
})
