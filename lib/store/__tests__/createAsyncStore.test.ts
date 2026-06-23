import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { createAsyncSlice, isAsyncReady, isCacheValid, selectAsyncState } from '../createAsyncStore'

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}))

describe('createAsyncStore', () => {
  describe('createAsyncSlice', () => {
    const mockSet = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
      mockSet.mockReset()
    })

    it('should return initial state with null data', () => {
      const slice = createAsyncSlice(mockSet, 'test', async () => 'data')

      expect(slice.data).toBeNull()
      expect(slice.isLoading).toBe(false)
      expect(slice.error).toBeNull()
      expect(slice.lastFetch).toBeUndefined()
    })

    it('should have fetch, reset, and clearError methods', () => {
      const slice = createAsyncSlice(mockSet, 'test', async () => 'data')

      expect(typeof slice.fetch).toBe('function')
      expect(typeof slice.reset).toBe('function')
      expect(typeof slice.clearError).toBe('function')
    })

    it('should reset state to initial values', () => {
      const slice = createAsyncSlice(mockSet, 'test', async () => 'data')

      slice.reset()

      expect(mockSet).toHaveBeenCalled()
      const setCall = mockSet.mock.calls[0][0]
      expect(setCall({ test: { data: null, isLoading: false, error: null } }).test.data).toBeNull()
    })

    it('should clear error state', () => {
      const slice = createAsyncSlice(mockSet, 'test', async () => 'data')

      slice.clearError()

      expect(mockSet).toHaveBeenCalled()
    })

    it('should set isLoading to true when fetching', async () => {
      let resolveFetch: (value: string) => void
      const fetchPromise = new Promise<string>(resolve => {
        resolveFetch = resolve
      })

      const slice = createAsyncSlice(mockSet, 'test', () => fetchPromise)

      const fetchPromise2 = slice.fetch()

      // Check that isLoading was set to true
      expect(mockSet).toHaveBeenCalled()
      const firstCall = mockSet.mock.calls[0]
      if (firstCall) {
        const stateSlice = firstCall[0]({ test: { data: null, isLoading: false, error: null } })
        expect(stateSlice.test.isLoading).toBe(true)
      }

      // Complete the fetch
      await act(async () => {
        resolveFetch!('fetched data')
        await fetchPromise2
      })
    })
  })

  describe('isAsyncReady', () => {
    it('should return false when data is null', () => {
      const state = { data: null, isLoading: false, error: null }
      expect(isAsyncReady(state)).toBe(false)
    })

    it('should return false when isLoading is true', () => {
      const state = { data: { id: 1 }, isLoading: true, error: null }
      expect(isAsyncReady(state)).toBe(false)
    })

    it('should return false when error is set', () => {
      const state = { data: { id: 1 }, isLoading: false, error: new Error('fail') }
      expect(isAsyncReady(state)).toBe(false)
    })

    it('should return true when data exists, not loading, no error', () => {
      const state = { data: { id: 1 }, isLoading: false, error: null }
      expect(isAsyncReady(state)).toBe(true)
    })
  })

  describe('selectAsyncState', () => {
    it('should return slice state when it exists', () => {
      const storeState = {
        test: { data: { id: 1 }, isLoading: false, error: null },
      }

      const result = selectAsyncState(storeState, 'test')

      expect(result.data).toEqual({ id: 1 })
      expect(result.isLoading).toBe(false)
    })

    it('should return default state when slice does not exist', () => {
      const storeState = {}

      const result = selectAsyncState(storeState, 'test')

      expect(result.data).toBeNull()
      expect(result.isLoading).toBe(false)
      expect(result.error).toBeNull()
    })
  })

  describe('isCacheValid', () => {
    it('should return false when lastFetch is undefined', () => {
      expect(isCacheValid(undefined)).toBe(false)
    })

    it('should return false when cache has expired', () => {
      const expiredTime = Date.now() - 6 * 60 * 1000 // 6 minutes ago
      expect(isCacheValid(expiredTime)).toBe(false)
    })

    it('should return true when cache is fresh', () => {
      const freshTime = Date.now() - 1 * 60 * 1000 // 1 minute ago
      expect(isCacheValid(freshTime)).toBe(true)
    })

    it('should use custom cache duration', () => {
      const time = Date.now() - 3 * 60 * 1000 // 3 minutes ago

      // Default 5 min cache - should be valid
      expect(isCacheValid(time)).toBe(true)

      // 2 min cache - should be invalid
      expect(isCacheValid(time, 2 * 60 * 1000)).toBe(false)
    })

    it('should return false at exact boundary (strict less-than)', () => {
      // At exactly cacheDuration ms ago, isCacheValid returns false (< is strict)
      const boundaryTime = Date.now() - 5 * 60 * 1000
      expect(isCacheValid(boundaryTime)).toBe(false)
    })

    it('should return true just before boundary', () => {
      // 1ms before the boundary should still be valid
      const justBeforeBoundary = Date.now() - 5 * 60 * 1000 + 1
      expect(isCacheValid(justBeforeBoundary)).toBe(true)
    })
  })
})
