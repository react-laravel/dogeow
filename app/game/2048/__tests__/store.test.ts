import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useGame2048Store } from '../store'

const resetStore = () => {
  useGame2048Store.setState({ bestScore: 0, gamesPlayed: 0, gamesWon: 0 })
}

describe('useGame2048Store', () => {
  beforeEach(() => {
    resetStore()
    localStorage.clear()
  })

  describe('initial state', () => {
    it('should have default values', () => {
      const state = useGame2048Store.getState()
      expect(state.bestScore).toBe(0)
      expect(state.gamesPlayed).toBe(0)
      expect(state.gamesWon).toBe(0)
    })

    it('should have all required actions', () => {
      const state = useGame2048Store.getState()
      expect(typeof state.setBestScore).toBe('function')
      expect(typeof state.incrementGamesPlayed).toBe('function')
      expect(typeof state.incrementGamesWon).toBe('function')
      expect(typeof state.resetStats).toBe('function')
    })
  })

  describe('setBestScore', () => {
    it('should update best score when new score is higher', () => {
      useGame2048Store.getState().setBestScore(100)
      expect(useGame2048Store.getState().bestScore).toBe(100)
    })

    it('should not update best score when new score is lower', () => {
      useGame2048Store.getState().setBestScore(100)
      useGame2048Store.getState().setBestScore(50)
      expect(useGame2048Store.getState().bestScore).toBe(100)
    })

    it('should update best score when equal', () => {
      useGame2048Store.getState().setBestScore(100)
      useGame2048Store.getState().setBestScore(100)
      expect(useGame2048Store.getState().bestScore).toBe(100)
    })

    it('should update from 0 to positive score', () => {
      useGame2048Store.getState().setBestScore(0)
      expect(useGame2048Store.getState().bestScore).toBe(0)
    })
  })

  describe('incrementGamesPlayed', () => {
    it('should increment games played', () => {
      useGame2048Store.getState().incrementGamesPlayed()
      expect(useGame2048Store.getState().gamesPlayed).toBe(1)
    })

    it('should increment multiple times', () => {
      useGame2048Store.getState().incrementGamesPlayed()
      useGame2048Store.getState().incrementGamesPlayed()
      useGame2048Store.getState().incrementGamesPlayed()
      expect(useGame2048Store.getState().gamesPlayed).toBe(3)
    })
  })

  describe('incrementGamesWon', () => {
    it('should increment games won', () => {
      useGame2048Store.getState().incrementGamesWon()
      expect(useGame2048Store.getState().gamesWon).toBe(1)
    })

    it('should increment multiple times', () => {
      useGame2048Store.getState().incrementGamesWon()
      useGame2048Store.getState().incrementGamesWon()
      expect(useGame2048Store.getState().gamesWon).toBe(2)
    })
  })

  describe('resetStats', () => {
    it('should reset all stats to 0', () => {
      useGame2048Store.getState().setBestScore(500)
      useGame2048Store.getState().incrementGamesPlayed()
      useGame2048Store.getState().incrementGamesWon()
      useGame2048Store.getState().resetStats()

      const state = useGame2048Store.getState()
      expect(state.bestScore).toBe(0)
      expect(state.gamesPlayed).toBe(0)
      expect(state.gamesWon).toBe(0)
    })
  })

  describe('persistence', () => {
    it('should persist stats to localStorage', () => {
      useGame2048Store.getState().setBestScore(200)
      useGame2048Store.getState().incrementGamesPlayed()

      const stored = localStorage.getItem('2048-game-storage')
      expect(stored).not.toBeNull()
    })
  })
})
