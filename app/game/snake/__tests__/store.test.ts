import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'

// Mock localStorage for zustand/persist
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Reset localStorage before each test
beforeEach(() => {
  localStorageMock.clear()
})

// We need to dynamically import after mocking localStorage
describe('snake game store', () => {
  let useSnakeGameStore: ReturnType<typeof import('../store').useSnakeGameStore>

  beforeEach(async () => {
    const storeModule = await import('../store')
    useSnakeGameStore = storeModule.useSnakeGameStore
    // Reset store state
    act(() => {
      useSnakeGameStore.setState({
        bestScore: 0,
        gamesPlayed: 0,
        totalFoodEaten: 0,
      })
    })
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useSnakeGameStore.getState()
      expect(state.bestScore).toBe(0)
      expect(state.gamesPlayed).toBe(0)
      expect(state.totalFoodEaten).toBe(0)
    })
  })

  describe('setBestScore', () => {
    it('should update best score when new score is higher', () => {
      useSnakeGameStore.getState().setBestScore(10)
      expect(useSnakeGameStore.getState().bestScore).toBe(10)
    })

    it('should not update best score when new score is lower', () => {
      const store = useSnakeGameStore.getState()
      act(() => {
        store.setBestScore(10)
      })
      expect(useSnakeGameStore.getState().bestScore).toBe(10)

      act(() => {
        store.setBestScore(5)
      })
      // Should remain 10
      expect(useSnakeGameStore.getState().bestScore).toBe(10)
    })

    it('should update best score when equal', () => {
      const store = useSnakeGameStore.getState()
      act(() => {
        store.setBestScore(10)
      })
      act(() => {
        store.setBestScore(10)
      })
      expect(useSnakeGameStore.getState().bestScore).toBe(10)
    })

    it('should update from 0 to any positive score', () => {
      useSnakeGameStore.getState().setBestScore(1)
      expect(useSnakeGameStore.getState().bestScore).toBe(1)
    })
  })

  describe('incrementGamesPlayed', () => {
    it('should increment games played', () => {
      const store = useSnakeGameStore.getState()
      act(() => {
        store.incrementGamesPlayed()
      })
      expect(useSnakeGameStore.getState().gamesPlayed).toBe(1)

      act(() => {
        store.incrementGamesPlayed()
      })
      expect(useSnakeGameStore.getState().gamesPlayed).toBe(2)
    })
  })

  describe('addFoodEaten', () => {
    it('should add food count', () => {
      const store = useSnakeGameStore.getState()
      act(() => {
        store.addFoodEaten(5)
      })
      expect(useSnakeGameStore.getState().totalFoodEaten).toBe(5)
    })

    it('should accumulate food count', () => {
      const store = useSnakeGameStore.getState()
      act(() => {
        store.addFoodEaten(3)
      })
      act(() => {
        store.addFoodEaten(2)
      })
      expect(useSnakeGameStore.getState().totalFoodEaten).toBe(5)
    })

    it('should handle adding zero', () => {
      const store = useSnakeGameStore.getState()
      act(() => {
        store.addFoodEaten(0)
      })
      expect(useSnakeGameStore.getState().totalFoodEaten).toBe(0)
    })
  })

  describe('resetStats', () => {
    it('should reset all stats to zero', () => {
      const store = useSnakeGameStore.getState()
      act(() => {
        store.setBestScore(100)
        store.incrementGamesPlayed()
        store.addFoodEaten(10)
      })
      expect(useSnakeGameStore.getState().bestScore).toBe(100)
      expect(useSnakeGameStore.getState().gamesPlayed).toBe(1)
      expect(useSnakeGameStore.getState().totalFoodEaten).toBe(10)

      act(() => {
        store.resetStats()
      })
      expect(useSnakeGameStore.getState().bestScore).toBe(0)
      expect(useSnakeGameStore.getState().gamesPlayed).toBe(0)
      expect(useSnakeGameStore.getState().totalFoodEaten).toBe(0)
    })
  })
})
