import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useState } from 'react'
import { useThingFilters } from '../useThingFilters'

// Mock filter persistence store
const mockSaveFilters = vi.fn()
const mockClearFilters = vi.fn()
const mockSavedFilters: any = {}

vi.mock('@/app/thing/stores/filterPersistenceStore', () => ({
  useFilterPersistenceStore: () => ({
    savedFilters: mockSavedFilters,
    saveFilters: mockSaveFilters,
    clearFilters: mockClearFilters,
  }),
}))

vi.mock('@/hooks/usePagination', () => ({
  usePagination: (initialPage?: number) => {
    const [page, setPage] = useState(initialPage ?? 1)
    return {
      currentPage: page,
      setPage: setPage,
      reset: () => setPage(initialPage ?? 1),
    }
  },
}))

describe('useThingFilters', () => {
  beforeEach(() => {
    mockSaveFilters.mockClear()
    mockClearFilters.mockClear()
    Object.assign(mockSavedFilters, {})
  })

  it('initializes with empty filters', () => {
    const { result } = renderHook(() => useThingFilters())
    expect(result.current.filters).toEqual({})
    expect(result.current.currentPage).toBe(1)
  })

  it('updates filters', () => {
    const { result } = renderHook(() => useThingFilters())
    act(() => {
      result.current.updateFilters({ name: 'test' })
    })
    expect(result.current.filters.name).toBe('test')
  })

  it('clears filters', () => {
    const { result } = renderHook(() => useThingFilters())
    act(() => {
      result.current.updateFilters({ name: 'test' })
    })
    act(() => {
      result.current.clearFilters()
    })
    expect(result.current.filters).toEqual({})
  })

  it('hasActiveFilters returns false for empty filters', () => {
    const { result } = renderHook(() => useThingFilters())
    expect(result.current.hasActiveFilters()).toBe(false)
  })

  it('hasActiveFilters returns true for active filters', () => {
    const { result } = renderHook(() => useThingFilters())
    act(() => {
      result.current.updateFilters({ name: 'test' })
    })
    expect(result.current.hasActiveFilters()).toBe(true)
  })

  it('setCurrentPage updates page', () => {
    const { result } = renderHook(() => useThingFilters())
    act(() => {
      result.current.setCurrentPage(3)
    })
    expect(result.current.currentPage).toBe(3)
  })
})
