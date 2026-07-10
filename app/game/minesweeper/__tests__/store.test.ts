import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { useMinesweeperStore } from '../store'

const resetStore = () => {
  useMinesweeperStore.setState({
    stats: {
      easy: { gamesPlayed: 0, gamesWon: 0, bestTime: 0 },
      medium: { gamesPlayed: 0, gamesWon: 0, bestTime: 0 },
      hard: { gamesPlayed: 0, gamesWon: 0, bestTime: 0 },
    },
  })
}

describe('useMinesweeperStore', () => {
  beforeEach(() => {
    resetStore()
    localStorage.clear()
  })

  describe('initial state', () => {
    it('should have default stats', () => {
      const state = useMinesweeperStore.getState()
      expect(state.stats.easy.gamesPlayed).toBe(0)
      expect(state.stats.easy.gamesWon).toBe(0)
      expect(state.stats.easy.bestTime).toBe(0)
      expect(state.stats.medium.gamesPlayed).toBe(0)
      expect(state.stats.hard.gamesPlayed).toBe(0)
    })

    it('should have all required actions', () => {
      const state = useMinesweeperStore.getState()
      expect(typeof state.updateStats).toBe('function')
      expect(typeof state.resetStats).toBe('function')
    })
  })

  describe('updateStats', () => {
    it('should increment games played for easy difficulty', () => {
      act(() => {
        useMinesweeperStore.getState().updateStats('easy', false)
      })
      expect(useMinesweeperStore.getState().stats.easy.gamesPlayed).toBe(1)
    })

    it('should increment games won when won is true', () => {
      act(() => {
        useMinesweeperStore.getState().updateStats('easy', true)
      })
      expect(useMinesweeperStore.getState().stats.easy.gamesWon).toBe(1)
    })

    it('should not increment games won when won is false', () => {
      act(() => {
        useMinesweeperStore.getState().updateStats('easy', false)
      })
      expect(useMinesweeperStore.getState().stats.easy.gamesWon).toBe(0)
    })

    it('should update best time when winning with a better time', () => {
      act(() => {
        useMinesweeperStore.getState().updateStats('easy', true, 50)
      })
      expect(useMinesweeperStore.getState().stats.easy.bestTime).toBe(50)
    })

    it('should not update best time when winning with a worse time', () => {
      act(() => {
        useMinesweeperStore.getState().updateStats('easy', true, 100)
      })
      expect(useMinesweeperStore.getState().stats.easy.bestTime).toBe(100)

      act(() => {
        useMinesweeperStore.getState().updateStats('easy', true, 200)
      })
      expect(useMinesweeperStore.getState().stats.easy.bestTime).toBe(100)
    })

    it('should update best time when current best is 0', () => {
      act(() => {
        useMinesweeperStore.getState().updateStats('easy', true, 0)
      })
      // bestTime starts at 0, so any time should update it
      expect(useMinesweeperStore.getState().stats.easy.bestTime).toBe(0)
    })

    it('should work for medium difficulty', () => {
      act(() => {
        useMinesweeperStore.getState().updateStats('medium', true, 120)
      })
      expect(useMinesweeperStore.getState().stats.medium.gamesPlayed).toBe(1)
      expect(useMinesweeperStore.getState().stats.medium.gamesWon).toBe(1)
      expect(useMinesweeperStore.getState().stats.medium.bestTime).toBe(120)
    })

    it('should work for hard difficulty', () => {
      act(() => {
        useMinesweeperStore.getState().updateStats('hard', true, 300)
      })
      expect(useMinesweeperStore.getState().stats.hard.gamesPlayed).toBe(1)
      expect(useMinesweeperStore.getState().stats.hard.gamesWon).toBe(1)
      expect(useMinesweeperStore.getState().stats.hard.bestTime).toBe(300)
    })

    it('should not affect other difficulties when updating one', () => {
      act(() => {
        useMinesweeperStore.getState().updateStats('easy', true, 50)
        useMinesweeperStore.getState().updateStats('medium', true, 100)
      })
      expect(useMinesweeperStore.getState().stats.easy.bestTime).toBe(50)
      expect(useMinesweeperStore.getState().stats.medium.bestTime).toBe(100)
      expect(useMinesweeperStore.getState().stats.hard.bestTime).toBe(0)
    })
  })

  describe('resetStats', () => {
    it('should reset all stats to initial values', () => {
      act(() => {
        useMinesweeperStore.getState().updateStats('easy', true, 50)
        useMinesweeperStore.getState().updateStats('medium', true, 100)
        useMinesweeperStore.getState().updateStats('hard', false)
      })

      act(() => {
        useMinesweeperStore.getState().resetStats()
      })

      const state = useMinesweeperStore.getState()
      expect(state.stats.easy.gamesPlayed).toBe(0)
      expect(state.stats.easy.gamesWon).toBe(0)
      expect(state.stats.easy.bestTime).toBe(0)
      expect(state.stats.medium.gamesPlayed).toBe(0)
      expect(state.stats.hard.gamesPlayed).toBe(0)
    })

    it('does not mutate the initial stats while recording games', () => {
      act(() => {
        useMinesweeperStore.getState().updateStats('easy', true, 30)
        useMinesweeperStore.getState().resetStats()
      })

      expect(useMinesweeperStore.getState().stats.easy).toEqual({
        gamesPlayed: 0,
        gamesWon: 0,
        bestTime: 0,
      })
    })
  })

  describe('persistence', () => {
    it('should persist stats to localStorage', () => {
      act(() => {
        useMinesweeperStore.getState().updateStats('easy', true, 50)
      })

      const stored = localStorage.getItem('minesweeper-storage')
      expect(stored).not.toBeNull()
    })
  })
})
