import { StateCreator } from 'zustand'
import { logger } from '@/lib/logger'

/**
 * Standardized async state for API requests
 * Used across all Zustand stores for consistent loading/error handling
 */
export interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  lastFetch?: number
}

/**
 * Standard async actions
 */
export interface AsyncActions<T, Args extends any[] = any[]> {
  /**
   * Fetch data with standardized loading/error handling
   */
  fetch(...args: Args): Promise<T | null>

  /**
   * Clear data and error state
   */
  reset(): void

  /**
   * Clear error state only
   */
  clearError(): void
}

export interface AsyncStoreState<T, Args extends any[] = any[]>
  extends AsyncState<T>,
    AsyncActions<T, Args> {}

/**
 * Creates a standardized async store slice
 *
 * Usage:
 * ```typescript
 * const useMyStore = create<MyStoreState>((set) => ({
 *   // Your other state...
 *
 *   // Add async slice for user data
 *   ...createAsyncSlice<User>(
 *     set,
 *     'user',
 *     async () => {
 *       return await fetchUser()
 *     }
 *   ),
 * }))
 * ```
 */
export function createAsyncSlice<T, Args extends any[] = any[]>(
  set: any,
  sliceName: string,
  fetchFn: (...args: Args) => Promise<T>
): AsyncStoreState<T, Args> {
  return {
    data: null,
    isLoading: false,
    error: null,
    lastFetch: undefined,

    fetch: async (...args: Args): Promise<T | null> => {
      set((state: any) => ({
        [sliceName]: {
          ...state[sliceName],
          isLoading: true,
          error: null,
        },
      }))

      try {
        const data = await fetchFn(...args)
        const now = Date.now()

        set((state: any) => ({
          [sliceName]: {
            ...state[sliceName],
            data,
            isLoading: false,
            error: null,
            lastFetch: now,
          },
        }))

        logger.debug(`${sliceName}: Fetch completed`, { data })
        return data
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))

        set((state: any) => ({
          [sliceName]: {
            ...state[sliceName],
            isLoading: false,
            error: err,
          },
        }))

        logger.error(`${sliceName}: Fetch failed`, err)
        return null
      }
    },

    reset: () => {
      set((state: any) => ({
        [sliceName]: {
          data: null,
          isLoading: false,
          error: null,
          lastFetch: undefined,
        },
      }))
    },

    clearError: () => {
      set((state: any) => ({
        [sliceName]: {
          ...state[sliceName],
          error: null,
        },
      }))
    },
  }
}

/**
 * Type guard for checking if data exists and is not loading
 */
export function isAsyncReady<T>(state: AsyncState<T>): state is AsyncState<T> & { data: T } {
  return state.data !== null && !state.isLoading && !state.error
}

/**
 * Hook for handling async state in components
 * Automatically handles loading, error, and data states
 */
export interface UseAsyncStateOptions {
  /**
   * Auto-fetch on mount
   */
  autoFetch?: boolean

  /**
   * Cache duration in milliseconds
   */
  cacheDuration?: number

  /**
   * Callback when data fetches
   */
  onSuccess?: (data: any) => void

  /**
   * Callback when fetch fails
   */
  onError?: (error: Error) => void
}

/**
 * Selects async state from store
 */
export function selectAsyncState<T>(state: any, sliceName: string): AsyncState<T> {
  return state[sliceName] || {
    data: null,
    isLoading: false,
    error: null,
  }
}

/**
 * Checks if cache is still valid
 */
export function isCacheValid(lastFetch?: number, cacheDuration: number = 5 * 60 * 1000): boolean {
  if (!lastFetch) return false
  return Date.now() - lastFetch < cacheDuration
}
