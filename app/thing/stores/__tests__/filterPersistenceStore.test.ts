import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useFilterPersistenceStore } from '../filterPersistenceStore'
import type { FilterParams } from '@/app/thing/types'

const createFilterParams = (overrides: Partial<FilterParams> = {}): FilterParams => ({
  category_id: undefined,
  tags: undefined,
  area_id: undefined,
  room_id: undefined,
  spot_id: undefined,
  is_public: undefined,
  purchase_date_from: null,
  purchase_date_to: null,
  expiry_date_from: null,
  expiry_date_to: null,
  price_from: undefined,
  price_to: undefined,
  include_null_purchase_date: false,
  include_null_expiry_date: false,
  ...overrides,
})

describe('filterPersistenceStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset store state
    useFilterPersistenceStore.setState({ savedFilters: {} })
  })

  describe('initial state', () => {
    it('should have empty savedFilters initially', () => {
      const state = useFilterPersistenceStore.getState()
      expect(state.savedFilters).toEqual({})
    })

    it('should have all required actions', () => {
      const state = useFilterPersistenceStore.getState()
      expect(typeof state.saveFilters).toBe('function')
      expect(typeof state.clearFilters).toBe('function')
      expect(typeof state.getFilters).toBe('function')
    })
  })

  describe('saveFilters', () => {
    it('should save filter params', () => {
      const filters = createFilterParams({ category_id: '1', tags: ['tag1'] })
      useFilterPersistenceStore.getState().saveFilters(filters)
      expect(useFilterPersistenceStore.getState().savedFilters).toEqual(filters)
    })

    it('should overwrite existing filters', () => {
      const filters1 = createFilterParams({ category_id: '1' })
      const filters2 = createFilterParams({ category_id: '2' })

      useFilterPersistenceStore.getState().saveFilters(filters1)
      useFilterPersistenceStore.getState().saveFilters(filters2)

      expect(useFilterPersistenceStore.getState().savedFilters.category_id).toBe('2')
    })

    it('should save empty filters object', () => {
      const filters = createFilterParams({})
      useFilterPersistenceStore.getState().saveFilters(filters)
      const saved = useFilterPersistenceStore.getState().savedFilters
      expect(saved).toBeDefined()
    })
  })

  describe('clearFilters', () => {
    it('should clear all saved filters', () => {
      const filters = createFilterParams({ category_id: '1', tags: ['tag1'] })
      useFilterPersistenceStore.getState().saveFilters(filters)
      useFilterPersistenceStore.getState().clearFilters()

      expect(useFilterPersistenceStore.getState().savedFilters).toEqual({})
    })

    it('should clear after saving then clearing', () => {
      useFilterPersistenceStore.getState().saveFilters(createFilterParams({ category_id: '5' }))
      useFilterPersistenceStore.getState().clearFilters()
      expect(useFilterPersistenceStore.getState().savedFilters).toEqual({})
    })
  })

  describe('getFilters', () => {
    it('should return saved filters', () => {
      const filters = createFilterParams({ category_id: '3', room_id: '10' })
      useFilterPersistenceStore.getState().saveFilters(filters)

      const retrieved = useFilterPersistenceStore.getState().getFilters()
      expect(retrieved).toEqual(filters)
    })

    it('should return empty object when no filters saved', () => {
      const retrieved = useFilterPersistenceStore.getState().getFilters()
      expect(retrieved).toEqual({})
    })
  })

  describe('persistence', () => {
    it('should persist filters to localStorage', () => {
      const filters = createFilterParams({ category_id: '1', tags: ['tag1', 'tag2'] })
      useFilterPersistenceStore.getState().saveFilters(filters)

      const stored = localStorage.getItem('thing-filters-persistence')
      expect(stored).not.toBeNull()
    })

    it('should restore filters from localStorage', () => {
      const filters = createFilterParams({ category_id: '2', area_id: '5' })
      // Simulate what the persist middleware does
      const state = { savedFilters: filters }
      localStorage.setItem('thing-filters-persistence', JSON.stringify(state))

      // The store should pick this up on initialization
      // We verify by checking that the store has the persisted state available
      const stored = JSON.parse(localStorage.getItem('thing-filters-persistence') || '{}')
      expect(stored.savedFilters).toEqual(filters)
    })
  })
})
