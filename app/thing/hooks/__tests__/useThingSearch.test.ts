import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useThingSearch } from '../useThingSearch'

describe('useThingSearch', () => {
  beforeEach(() => {
    window.history.replaceState = vi.fn()
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

  it('handleSearch updates term and URL', () => {
    const { result } = renderHook(() => useThingSearch())
    act(() => {
      result.current.handleSearch('laptop')
    })
    expect(result.current.searchTerm).toBe('laptop')
    expect(window.history.replaceState).toHaveBeenCalled()
  })
})
