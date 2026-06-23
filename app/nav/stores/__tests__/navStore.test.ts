import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNavStore } from '../navStore'
import type { NavCategory, NavItem } from '@/app/nav/types'

const mockGetCategories = vi.fn()
const mockGetAllCategories = vi.fn()
const mockGetItems = vi.fn()
const mockRecordClick = vi.fn()
const mockCreateCategory = vi.fn()
const mockUpdateCategory = vi.fn()
const mockDeleteCategory = vi.fn()
const mockCreateItem = vi.fn()
const mockUpdateItem = vi.fn()
const mockDeleteItem = vi.fn()

vi.mock('@/app/nav/services/api', () => ({
  getCategories: (...args: unknown[]) => mockGetCategories(...args),
  getAllCategories: (...args: unknown[]) => mockGetAllCategories(...args),
  getItems: (...args: unknown[]) => mockGetItems(...args),
  recordClick: (...args: unknown[]) => mockRecordClick(...args),
  createCategory: (...args: unknown[]) => mockCreateCategory(...args),
  updateCategory: (...args: unknown[]) => mockUpdateCategory(...args),
  deleteCategory: (...args: unknown[]) => mockDeleteCategory(...args),
  createItem: (...args: unknown[]) => mockCreateItem(...args),
  updateItem: (...args: unknown[]) => mockUpdateItem(...args),
  deleteItem: (...args: unknown[]) => mockDeleteItem(...args),
}))

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

describe('navStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useNavStore.setState({
      categories: [],
      allCategories: [],
      items: [],
      isSampleData: false,
      loading: false,
      error: null,
      searchTerm: '',
    })
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useNavStore.getState()
      expect(state.categories).toEqual([])
      expect(state.allCategories).toEqual([])
      expect(state.items).toEqual([])
      expect(state.isSampleData).toBe(false)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.searchTerm).toBe('')
    })
  })

  describe('setSearchTerm', () => {
    it('should update searchTerm', () => {
      useNavStore.getState().setSearchTerm('test')
      expect(useNavStore.getState().searchTerm).toBe('test')
    })

    it('should handle empty searchTerm', () => {
      useNavStore.getState().setSearchTerm('')
      expect(useNavStore.getState().searchTerm).toBe('')
    })
  })

  describe('handleSearch', () => {
    it('should update searchTerm', () => {
      useNavStore.getState().handleSearch('hello')
      expect(useNavStore.getState().searchTerm).toBe('hello')
    })
  })

  describe('fetchCategories', () => {
    it('should fetch categories and update state', async () => {
      const categories = [makeCategory({ id: 1 }), makeCategory({ id: 2 })]
      mockGetCategories.mockResolvedValue(categories)

      const result = await useNavStore.getState().fetchCategories()

      expect(mockGetCategories).toHaveBeenCalledWith(undefined)
      expect(useNavStore.getState().categories).toEqual(categories)
      expect(useNavStore.getState().loading).toBe(false)
      expect(result).toEqual(categories)
    })

    it('should fetch categories with filter', async () => {
      const categories = [makeCategory({ id: 1, name: 'Dev' })]
      mockGetCategories.mockResolvedValue(categories)

      await useNavStore.getState().fetchCategories('Dev')

      expect(mockGetCategories).toHaveBeenCalledWith('Dev')
    })

    it('should handle empty response', async () => {
      mockGetCategories.mockResolvedValue(null)

      const result = await useNavStore.getState().fetchCategories()

      expect(useNavStore.getState().categories).toEqual([])
      expect(result).toEqual([])
    })

    it('should handle error', async () => {
      mockGetCategories.mockRejectedValue(new Error('Network error'))

      await expect(useNavStore.getState().fetchCategories()).rejects.toThrow('Network error')
      expect(useNavStore.getState().error).toBe('Network error')
      expect(useNavStore.getState().loading).toBe(false)
    })

    it('should return sample data when isSampleData is true', async () => {
      const sampleCategories = [makeCategory({ id: 1 })]
      useNavStore.setState({ categories: sampleCategories, isSampleData: true })

      const result = await useNavStore.getState().fetchCategories()

      expect(mockGetCategories).not.toHaveBeenCalled()
      expect(result).toEqual(sampleCategories)
    })
  })

  describe('fetchAllCategories', () => {
    it('should fetch all categories and update state', async () => {
      const allCategories = [makeCategory({ id: 1 }), makeCategory({ id: 2 })]
      mockGetAllCategories.mockResolvedValue(allCategories)

      const result = await useNavStore.getState().fetchAllCategories()

      expect(mockGetAllCategories).toHaveBeenCalled()
      expect(useNavStore.getState().allCategories).toEqual(allCategories)
      expect(result).toEqual(allCategories)
    })

    it('should return empty array on null response', async () => {
      mockGetAllCategories.mockResolvedValue(null)

      const result = await useNavStore.getState().fetchAllCategories()

      expect(useNavStore.getState().allCategories).toEqual([])
      expect(result).toEqual([])
    })

    it('should handle error', async () => {
      mockGetAllCategories.mockRejectedValue(new Error('API error'))

      await expect(useNavStore.getState().fetchAllCategories()).rejects.toThrow('API error')
      expect(useNavStore.getState().error).toBe('API error')
    })

    it('should return sample data when isSampleData is true', async () => {
      const sampleCategories = [makeCategory({ id: 1 })]
      useNavStore.setState({ allCategories: sampleCategories, isSampleData: true })

      const result = await useNavStore.getState().fetchAllCategories()

      expect(mockGetAllCategories).not.toHaveBeenCalled()
      expect(result).toEqual(sampleCategories)
    })
  })

  describe('fetchItems', () => {
    it('should fetch items and update state', async () => {
      const items = [makeItem({ id: 1 }), makeItem({ id: 2 })]
      mockGetItems.mockResolvedValue(items)

      const result = await useNavStore.getState().fetchItems()

      expect(mockGetItems).toHaveBeenCalledWith(undefined)
      expect(useNavStore.getState().items).toEqual(items)
      expect(result).toEqual(items)
    })

    it('should fetch items filtered by category', async () => {
      const items = [makeItem({ id: 1, nav_category_id: 1 })]
      mockGetItems.mockResolvedValue(items)

      await useNavStore.getState().fetchItems(1)

      expect(mockGetItems).toHaveBeenCalledWith(1)
    })

    it('should filter sample items by category', async () => {
      const sampleItems = [
        makeItem({ id: 1, nav_category_id: 1 }),
        makeItem({ id: 2, nav_category_id: 2 }),
      ]
      useNavStore.setState({ items: sampleItems, isSampleData: true })

      const result = await useNavStore.getState().fetchItems(1)

      expect(mockGetItems).not.toHaveBeenCalled()
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
    })

    it('should return all sample items without filter', async () => {
      const sampleItems = [
        makeItem({ id: 1, nav_category_id: 1 }),
        makeItem({ id: 2, nav_category_id: 2 }),
      ]
      useNavStore.setState({ items: sampleItems, isSampleData: true })

      const result = await useNavStore.getState().fetchItems()

      expect(result).toHaveLength(2)
    })

    it('should handle error', async () => {
      mockGetItems.mockRejectedValue(new Error('Fetch error'))

      await expect(useNavStore.getState().fetchItems()).rejects.toThrow('Fetch error')
      expect(useNavStore.getState().error).toBe('Fetch error')
    })
  })

  describe('applySampleData', () => {
    it('should apply sample data when store is empty', () => {
      useNavStore.getState().applySampleData()

      const state = useNavStore.getState()
      expect(state.isSampleData).toBe(true)
      expect(state.categories.length).toBeGreaterThan(0)
      expect(state.items.length).toBeGreaterThan(0)
    })

    it('should not apply sample data when store already has data', () => {
      useNavStore.setState({
        categories: [makeCategory({ id: 99 })],
        items: [makeItem({ id: 99 })],
      })

      useNavStore.getState().applySampleData()

      expect(useNavStore.getState().isSampleData).toBe(false)
      expect(useNavStore.getState().categories[0].id).toBe(99)
    })

    it('should not apply sample data when isSampleData is already true', () => {
      useNavStore.setState({ isSampleData: true, categories: [], items: [] })

      useNavStore.getState().applySampleData()

      expect(useNavStore.getState().categories).toEqual([])
    })
  })

  describe('createCategory', () => {
    it('should create category and update state', async () => {
      const newCategory = makeCategory({ id: 10, name: 'New Category' })
      mockCreateCategory.mockResolvedValue(newCategory)

      const result = await useNavStore.getState().createCategory({ name: 'New Category' })

      expect(mockCreateCategory).toHaveBeenCalledWith({ name: 'New Category' })
      expect(useNavStore.getState().categories).toContainEqual(newCategory)
      expect(useNavStore.getState().allCategories).toContainEqual(newCategory)
      expect(result).toEqual(newCategory)
    })

    it('should handle error', async () => {
      mockCreateCategory.mockRejectedValue(new Error('Create failed'))

      await expect(useNavStore.getState().createCategory({ name: 'Fail' })).rejects.toThrow(
        'Create failed'
      )
      expect(useNavStore.getState().error).toBe('Create failed')
    })
  })

  describe('updateCategory', () => {
    it('should update category in state', async () => {
      const existing = makeCategory({ id: 1, name: 'Old' })
      const updated = makeCategory({ id: 1, name: 'Updated' })
      useNavStore.setState({ categories: [existing], allCategories: [existing] })

      mockUpdateCategory.mockResolvedValue(updated)

      const result = await useNavStore.getState().updateCategory(1, { name: 'Updated' })

      expect(mockUpdateCategory).toHaveBeenCalledWith(1, { name: 'Updated' })
      expect(useNavStore.getState().categories[0].name).toBe('Updated')
      expect(useNavStore.getState().allCategories[0].name).toBe('Updated')
      expect(result).toEqual(updated)
    })

    it('should handle error', async () => {
      mockUpdateCategory.mockRejectedValue(new Error('Update failed'))

      await expect(useNavStore.getState().updateCategory(1, { name: 'Fail' })).rejects.toThrow(
        'Update failed'
      )
      expect(useNavStore.getState().error).toBe('Update failed')
    })
  })

  describe('deleteCategory', () => {
    it('should delete category from state', async () => {
      const cat1 = makeCategory({ id: 1 })
      const cat2 = makeCategory({ id: 2 })
      useNavStore.setState({ categories: [cat1, cat2], allCategories: [cat1, cat2] })

      mockDeleteCategory.mockResolvedValue({ success: true })

      await useNavStore.getState().deleteCategory(1)

      expect(mockDeleteCategory).toHaveBeenCalledWith(1)
      expect(useNavStore.getState().categories).toHaveLength(1)
      expect(useNavStore.getState().categories[0].id).toBe(2)
    })

    it('should handle error', async () => {
      mockDeleteCategory.mockRejectedValue(new Error('Delete failed'))

      await expect(useNavStore.getState().deleteCategory(1)).rejects.toThrow('Delete failed')
      expect(useNavStore.getState().error).toBe('Delete failed')
    })
  })

  describe('createItem', () => {
    it('should create item and update state', async () => {
      const newItem = makeItem({ id: 10, name: 'New Item' })
      mockCreateItem.mockResolvedValue(newItem)

      const result = await useNavStore
        .getState()
        .createItem({ name: 'New Item', url: 'https://new.com' })

      expect(mockCreateItem).toHaveBeenCalledWith({ name: 'New Item', url: 'https://new.com' })
      expect(useNavStore.getState().items).toContainEqual(newItem)
      expect(result).toEqual(newItem)
    })

    it('should add item to the correct category', async () => {
      const category = makeCategory({ id: 1, items: [] })
      const newItem = makeItem({ id: 10, nav_category_id: 1 })
      useNavStore.setState({ categories: [category] })

      mockCreateItem.mockResolvedValue(newItem)

      await useNavStore
        .getState()
        .createItem({ name: 'New', url: 'https://x.com', nav_category_id: 1 })

      expect(useNavStore.getState().categories[0].items).toContainEqual(newItem)
    })

    it('should handle error', async () => {
      mockCreateItem.mockRejectedValue(new Error('Create failed'))

      await expect(useNavStore.getState().createItem({ name: 'Fail' })).rejects.toThrow(
        'Create failed'
      )
      expect(useNavStore.getState().error).toBe('Create failed')
    })
  })

  describe('updateItem', () => {
    it('should update item in state', async () => {
      const existing = makeItem({ id: 1, name: 'Old' })
      const updated = makeItem({ id: 1, name: 'Updated' })
      useNavStore.setState({ items: [existing] })

      mockUpdateItem.mockResolvedValue(updated)

      const result = await useNavStore.getState().updateItem(1, { name: 'Updated' })

      expect(mockUpdateItem).toHaveBeenCalledWith(1, { name: 'Updated' })
      expect(useNavStore.getState().items[0].name).toBe('Updated')
      expect(result).toEqual(updated)
    })

    it('should handle error', async () => {
      mockUpdateItem.mockRejectedValue(new Error('Update failed'))

      await expect(useNavStore.getState().updateItem(1, { name: 'Fail' })).rejects.toThrow(
        'Update failed'
      )
      expect(useNavStore.getState().error).toBe('Update failed')
    })
  })

  describe('deleteItem', () => {
    it('should delete item from state', async () => {
      const item1 = makeItem({ id: 1, nav_category_id: 1 })
      const item2 = makeItem({ id: 2, nav_category_id: 1 })
      const category = makeCategory({ id: 1, items: [item1, item2] })
      useNavStore.setState({ items: [item1, item2], categories: [category] })

      mockDeleteItem.mockResolvedValue({ success: true })

      await useNavStore.getState().deleteItem(1)

      expect(mockDeleteItem).toHaveBeenCalledWith(1)
      expect(useNavStore.getState().items).toHaveLength(1)
      expect(useNavStore.getState().items[0].id).toBe(2)
      expect(useNavStore.getState().categories[0].items).toHaveLength(1)
    })

    it('should handle error', async () => {
      mockDeleteItem.mockRejectedValue(new Error('Delete failed'))

      await expect(useNavStore.getState().deleteItem(1)).rejects.toThrow('Delete failed')
      expect(useNavStore.getState().error).toBe('Delete failed')
    })
  })

  describe('recordClick', () => {
    it('should increment click count', async () => {
      const item = makeItem({ id: 1, clicks: 5 })
      useNavStore.setState({ items: [item] })

      mockRecordClick.mockResolvedValue({ success: true })

      await useNavStore.getState().recordClick(1)

      expect(mockRecordClick).toHaveBeenCalledWith(1)
      expect(useNavStore.getState().items[0].clicks).toBe(6)
    })

    it('should handle zero clicks', async () => {
      const item = makeItem({ id: 1, clicks: 0 })
      useNavStore.setState({ items: [item] })

      mockRecordClick.mockResolvedValue({ success: true })

      await useNavStore.getState().recordClick(1)

      expect(useNavStore.getState().items[0].clicks).toBe(1)
    })

    it('should handle item with undefined clicks', async () => {
      const item = makeItem({ id: 1, clicks: undefined as unknown as number })
      useNavStore.setState({ items: [item] })

      mockRecordClick.mockResolvedValue({ success: true })

      await useNavStore.getState().recordClick(1)

      expect(useNavStore.getState().items[0].clicks).toBe(1)
    })

    it('should handle error gracefully', async () => {
      mockRecordClick.mockRejectedValue(new Error('Click failed'))

      // Should not throw - error is caught
      await expect(useNavStore.getState().recordClick(1)).resolves.toBeUndefined()
    })
  })
})
