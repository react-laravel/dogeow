import { describe, expect, it, vi } from 'vitest'
import { applyFilters, getInitialFilterState, hasActiveFilters } from '../filters/utils/filterUtils'
import { initialFilters, type FilterState } from '../filters/types'

describe('filters/utils/filterUtils', () => {
  it('applyFilters strips empty defaults, keeps special flags, and converts tag string', () => {
    const onApply = vi.fn()
    const filters: FilterState = {
      ...initialFilters,
      name: '牙刷',
      status: 'active',
      tags: '1, 2,3',
      category_id: 'all',
      is_public: false,
      include_null_purchase_date: true,
      exclude_null_purchase_date: true,
      exclude_null_expiry_date: true,
    }

    applyFilters(filters, onApply)

    const applied = onApply.mock.calls[0][0] as FilterState
    expect(applied).toMatchObject({
      name: '牙刷',
      status: 'active',
      tags: [1, 2, 3],
      is_public: false,
      include_null_purchase_date: true,
      include_null_expiry_date: false,
    })
    expect(applied).not.toHaveProperty('category_id')
    expect(applied).not.toHaveProperty('exclude_null_purchase_date')
    expect(applied).not.toHaveProperty('exclude_null_expiry_date')
  })

  it('hasActiveFilters detects date and non-date field changes', () => {
    expect(hasActiveFilters(initialFilters)).toBe(false)
    expect(
      hasActiveFilters({
        ...initialFilters,
        purchase_date_from: new Date('2024-01-01'),
      })
    ).toBe(true)
    expect(
      hasActiveFilters({
        ...initialFilters,
        name: '关键字',
      })
    ).toBe(true)
  })

  it('getInitialFilterState returns defaults when empty', () => {
    expect(getInitialFilterState({})).toEqual(initialFilters)
  })

  it('getInitialFilterState converts known date keys and merges normal values', () => {
    const result = getInitialFilterState({
      name: '旧筛选',
      status: 'idle',
      purchase_date_from: '2024-01-01T00:00:00.000Z',
      purchase_date_to: '2024-02-01T00:00:00.000Z',
      expiry_date_from: '2024-03-01T00:00:00.000Z',
      expiry_date_to: '2024-04-01T00:00:00.000Z',
      include_null_expiry_date: true,
      unknown_key: 'ignored',
    })

    expect(result.name).toBe('旧筛选')
    expect(result.status).toBe('idle')
    expect(result.include_null_expiry_date).toBe(true)
    expect(result.purchase_date_from).toBeInstanceOf(Date)
    expect(result.purchase_date_to).toBeInstanceOf(Date)
    expect(result.expiry_date_from).toBeInstanceOf(Date)
    expect(result.expiry_date_to).toBeInstanceOf(Date)
    expect(result).not.toHaveProperty('unknown_key')
  })

  it('getInitialFilterState keeps null defaults when saved date is falsy', () => {
    const result = getInitialFilterState({
      purchase_date_from: '',
      expiry_date_to: null,
    })
    expect(result.purchase_date_from).toBeNull()
    expect(result.expiry_date_to).toBeNull()
  })

  it('getInitialFilterState handles Date objects in saved filters', () => {
    const date = new Date('2024-06-15')
    const result = getInitialFilterState({
      purchase_date_from: date,
    })
    expect(result.purchase_date_from).toBeInstanceOf(Date)
    expect(result.purchase_date_from).toEqual(date)
  })

  it('getInitialFilterState preserves initial values for unknown keys', () => {
    const result = getInitialFilterState({
      unknown_field: 'should be ignored',
    })
    expect(result.name).toBe(initialFilters.name)
    expect(result.status).toBe(initialFilters.status)
  })
})

describe('hasActiveFilters edge cases', () => {
  it('should detect active date_to filters', () => {
    expect(
      hasActiveFilters({
        ...initialFilters,
        purchase_date_to: new Date('2024-12-31'),
      })
    ).toBe(true)
  })

  it('should detect active expiry date filters', () => {
    expect(
      hasActiveFilters({
        ...initialFilters,
        expiry_date_from: new Date('2024-01-01'),
        expiry_date_to: new Date('2024-12-31'),
      })
    ).toBe(true)
  })

  it('should return false when clearing a date filter (set to null)', () => {
    const filtersWithDate = {
      ...initialFilters,
      purchase_date_from: new Date('2024-01-01'),
    }
    expect(hasActiveFilters(filtersWithDate)).toBe(true)

    const clearedFilters = {
      ...initialFilters,
      purchase_date_from: null,
    }
    expect(hasActiveFilters(clearedFilters)).toBe(false)
  })

  it('should not detect changes when date field is already set and stays the same', () => {
    const existingDate = new Date('2024-06-15')
    const filtersWithDate = {
      ...initialFilters,
      purchase_date_from: existingDate,
    }
    expect(hasActiveFilters(filtersWithDate)).toBe(true)
  })

  it('should handle filters with only date_to changed', () => {
    const result = hasActiveFilters({
      ...initialFilters,
      expiry_date_to: new Date('2024-12-31'),
    })
    expect(result).toBe(true)
  })

  it('should return false for initial filters state', () => {
    expect(hasActiveFilters(initialFilters)).toBe(false)
  })

  it('should detect changes in non-date fields', () => {
    expect(hasActiveFilters({ ...initialFilters, name: 'test' })).toBe(true)
    expect(hasActiveFilters({ ...initialFilters, status: 'archived' })).toBe(true)
  })
})

describe('applyFilters edge cases', () => {
  it('should handle empty tags string', () => {
    const onApply = vi.fn()
    const filters: FilterState = {
      ...initialFilters,
      tags: '',
    }
    applyFilters(filters, onApply)
    const applied = onApply.mock.calls[0][0] as FilterState
    expect(applied.tags).toEqual([])
  })

  it('should handle tags with extra whitespace', () => {
    const onApply = vi.fn()
    const filters: FilterState = {
      ...initialFilters,
      tags: '1, 2 , 3 ,4',
    }
    applyFilters(filters, onApply)
    const applied = onApply.mock.calls[0][0] as FilterState
    expect(applied.tags).toEqual([1, 2, 3, 4])
  })

  it('should handle tags with multiple consecutive commas', () => {
    const onApply = vi.fn()
    const filters: FilterState = {
      ...initialFilters,
      tags: '1,,2,  ,3',
    }
    applyFilters(filters, onApply)
    const applied = onApply.mock.calls[0][0] as FilterState
    expect(applied.tags).toEqual([1, 2, 3])
  })

  it('should filter out exclude_null fields regardless of value', () => {
    const onApply = vi.fn()
    const filters: FilterState = {
      ...initialFilters,
      exclude_null_purchase_date: true,
      exclude_null_expiry_date: false,
    }
    applyFilters(filters, onApply)
    const applied = onApply.mock.calls[0][0] as FilterState
    expect(applied).not.toHaveProperty('exclude_null_purchase_date')
    expect(applied).not.toHaveProperty('exclude_null_expiry_date')
  })

  it('should keep is_public false value', () => {
    const onApply = vi.fn()
    const filters: FilterState = {
      ...initialFilters,
      is_public: false,
    }
    applyFilters(filters, onApply)
    const applied = onApply.mock.calls[0][0] as FilterState
    expect(applied.is_public).toBe(false)
  })

  it('should handle numeric values in non-tag fields', () => {
    const onApply = vi.fn()
    const filters: FilterState = {
      ...initialFilters,
      category_id: 123,
    }
    applyFilters(filters, onApply)
    const applied = onApply.mock.calls[0][0] as FilterState
    expect(applied.category_id).toBe(123)
  })

  it('should keep include_null flags even when true', () => {
    const onApply = vi.fn()
    const filters: FilterState = {
      ...initialFilters,
      include_null_purchase_date: true,
      include_null_expiry_date: true,
    }
    applyFilters(filters, onApply)
    const applied = onApply.mock.calls[0][0] as FilterState
    expect(applied.include_null_purchase_date).toBe(true)
    expect(applied.include_null_expiry_date).toBe(true)
  })
})
