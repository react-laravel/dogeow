import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useThingSearch } from '../useThingSearch'

// Mock useItemStore
const mockFetchItems = vi.fn()

vi.mock('@/app/thing/stores/itemStore', () => ({
  useItemStore: () => ({
    fetchItems: mockFetchItems,
  }),
}))

describe('useThingSearch', () => {
  beforeEach(() => {
    mockFetchItems.mockClear()
    // Mock window.history
    const originalReplaceState = window.history.replaceState
    window.history.replaceState = vi.fn()
    ;(window.history as any).replaceState.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with empty search term', () => {
    const { result } = renderHook(() => useThingSearch())
    expect(result.current.searchTerm).toBe('')
    expect(result.current.isSearching).toBe(false)
  })

  it('has setSearchTerm and handleSearch methods', () => {
    const { result } = renderHook(() => useThingSearch())
    expect(typeof result.current.setSearchTerm).toBe('function')
    expect(typeof result.current.handleSearch).toBe('function')
  })

  it('setSearchTerm updates the term', () => {
    const { result } = renderHook(() => useThingSearch())
    act(() => {
      result.current.setSearchTerm('test')
    })
    expect(result.current.searchTerm).toBe('test')
  })
})
