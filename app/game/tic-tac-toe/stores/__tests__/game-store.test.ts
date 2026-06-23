import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useGameStore } from '../game-store'

const resetStore = () => {
  useGameStore.setState({
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
    gameOver: false,
    gameMode: 'pvp',
    difficulty: 'medium',
    scores: { X: 0, O: 0, draws: 0 },
    isAiThinking: false,
  })
}

describe('tic-tac-toe game store', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useGameStore.getState()
      expect(state.board).toHaveLength(9)
      expect(state.board.every(cell => cell === null)).toBe(true)
      expect(state.currentPlayer).toBe('X')
      expect(state.winner).toBeNull()
      expect(state.gameOver).toBe(false)
      expect(state.gameMode).toBe('pvp')
      expect(state.difficulty).toBe('medium')
      expect(state.scores).toEqual({ X: 0, O: 0, draws: 0 })
    })
  })

  describe('makeMove', () => {
    it('should place X on the board', () => {
      useGameStore.getState().makeMove(0)
      expect(useGameStore.getState().board[0]).toBe('X')
    })

    it('should switch player after a move', () => {
      const store = useGameStore.getState()
      act(() => {
        store.makeMove(0)
      })
      expect(useGameStore.getState().currentPlayer).toBe('O')
    })

    it('should not allow move on occupied cell', () => {
      const store = useGameStore.getState()
      act(() => {
        store.makeMove(0)
      })
      expect(useGameStore.getState().board[0]).toBe('X')

      act(() => {
        store.makeMove(0)
      })
      // Should still be X, not overwritten
      expect(useGameStore.getState().board[0]).toBe('X')
    })

    it('should not allow move after game over', () => {
      // X wins with top row
      const store = useGameStore.getState()
      act(() => {
        store.makeMove(0) // X
        store.makeMove(3) // O
        store.makeMove(1) // X
        store.makeMove(4) // O
        store.makeMove(2) // X wins
      })
      expect(useGameStore.getState().gameOver).toBe(true)
      expect(useGameStore.getState().winner).toBe('X')

      // Try to make another move
      act(() => {
        store.makeMove(5)
      })
      // Board should not change at index 5 (still null)
      expect(useGameStore.getState().board[5]).toBeNull()
    })
  })

  describe('win detection', () => {
    it('should detect horizontal win (top row)', () => {
      const store = useGameStore.getState()
      act(() => {
        store.makeMove(0) // X
        store.makeMove(3) // O
        store.makeMove(1) // X
        store.makeMove(4) // O
        store.makeMove(2) // X wins
      })
      expect(useGameStore.getState().winner).toBe('X')
      expect(useGameStore.getState().gameOver).toBe(true)
    })

    it('should detect horizontal win (middle row)', () => {
      const store = useGameStore.getState()
      act(() => {
        store.makeMove(3) // X
        store.makeMove(0) // O
        store.makeMove(4) // X
        store.makeMove(1) // O
        store.makeMove(5) // X wins
      })
      expect(useGameStore.getState().winner).toBe('X')
    })

    it('should detect horizontal win (bottom row)', () => {
      const store = useGameStore.getState()
      act(() => {
        store.makeMove(6) // X
        store.makeMove(0) // O
        store.makeMove(7) // X
        store.makeMove(1) // O
        store.makeMove(8) // X wins
      })
      expect(useGameStore.getState().winner).toBe('X')
    })

    it('should detect vertical win (left column)', () => {
      const store = useGameStore.getState()
      act(() => {
        store.makeMove(0) // X
        store.makeMove(1) // O
        store.makeMove(3) // X
        store.makeMove(2) // O
        store.makeMove(6) // X wins
      })
      expect(useGameStore.getState().winner).toBe('X')
    })

    it('should detect vertical win (middle column)', () => {
      const store = useGameStore.getState()
      act(() => {
        store.makeMove(1) // X
        store.makeMove(0) // O
        store.makeMove(4) // X
        store.makeMove(2) // O
        store.makeMove(7) // X wins
      })
      expect(useGameStore.getState().winner).toBe('X')
    })

    it('should detect vertical win (right column)', () => {
      const store = useGameStore.getState()
      act(() => {
        store.makeMove(2) // X
        store.makeMove(0) // O
        store.makeMove(5) // X
        store.makeMove(1) // O
        store.makeMove(8) // X wins
      })
      expect(useGameStore.getState().winner).toBe('X')
    })

    it('should detect diagonal win (top-left to bottom-right)', () => {
      const store = useGameStore.getState()
      act(() => {
        store.makeMove(0) // X
        store.makeMove(1) // O
        store.makeMove(4) // X
        store.makeMove(2) // O
        store.makeMove(8) // X wins
      })
      expect(useGameStore.getState().winner).toBe('X')
    })

    it('should detect diagonal win (top-right to bottom-left)', () => {
      const store = useGameStore.getState()
      act(() => {
        store.makeMove(2) // X
        store.makeMove(0) // O
        store.makeMove(4) // X
        store.makeMove(1) // O
        store.makeMove(6) // X wins
      })
      expect(useGameStore.getState().winner).toBe('X')
    })

    it('should detect O win', () => {
      const store = useGameStore.getState()
      act(() => {
        store.makeMove(0) // X
        store.makeMove(3) // O
        store.makeMove(1) // X
        store.makeMove(4) // O
        store.makeMove(8) // X
        store.makeMove(5) // O wins
      })
      expect(useGameStore.getState().winner).toBe('O')
    })
  })

  describe('draw detection', () => {
    it('should detect draw when board is full', () => {
      // X O X
      // O X X
      // O X O  (no three-in-a-row for either player)
      const store = useGameStore.getState()
      act(() => {
        store.makeMove(0) // X
        store.makeMove(1) // O
        store.makeMove(2) // X
        store.makeMove(3) // O
        store.makeMove(4) // X
        store.makeMove(6) // O
        store.makeMove(5) // X
        store.makeMove(8) // O
        store.makeMove(7) // X
      })
      expect(useGameStore.getState().gameOver).toBe(true)
      expect(useGameStore.getState().winner).toBeNull()
      expect(useGameStore.getState().scores.draws).toBe(1)
    })
  })

  describe('score tracking', () => {
    it('should increment X score on X win', () => {
      const store = useGameStore.getState()
      act(() => {
        store.makeMove(0) // X
        store.makeMove(3) // O
        store.makeMove(1) // X
        store.makeMove(4) // O
        store.makeMove(2) // X wins
      })
      expect(useGameStore.getState().scores.X).toBe(1)
    })

    it('should increment O score on O win', () => {
      const store = useGameStore.getState()
      act(() => {
        store.makeMove(0) // X
        store.makeMove(3) // O
        store.makeMove(1) // X
        store.makeMove(4) // O
        store.makeMove(8) // X
        store.makeMove(5) // O wins
      })
      expect(useGameStore.getState().scores.O).toBe(1)
    })

    it('should not change score on draw', () => {
      const store = useGameStore.getState()
      act(() => {
        store.makeMove(0) // X
        store.makeMove(1) // O
        store.makeMove(2) // X
        store.makeMove(3) // O
        store.makeMove(4) // X
        store.makeMove(6) // O
        store.makeMove(5) // X
        store.makeMove(8) // O
        store.makeMove(7) // X (draw)
      })
      expect(useGameStore.getState().scores.X).toBe(0)
      expect(useGameStore.getState().scores.O).toBe(0)
      expect(useGameStore.getState().scores.draws).toBe(1)
    })
  })

  describe('resetGame', () => {
    it('should reset the board but keep scores', () => {
      const store = useGameStore.getState()
      // Play a game to completion
      act(() => {
        store.makeMove(0)
        store.makeMove(3)
        store.makeMove(1)
        store.makeMove(4)
        store.makeMove(2)
      })
      expect(useGameStore.getState().winner).toBe('X')
      expect(useGameStore.getState().scores.X).toBe(1)

      // Reset game
      act(() => {
        store.resetGame()
      })

      expect(useGameStore.getState().board).toEqual(Array(9).fill(null))
      expect(useGameStore.getState().currentPlayer).toBe('X')
      expect(useGameStore.getState().winner).toBeNull()
      expect(useGameStore.getState().gameOver).toBe(false)
      // Scores should be preserved
      expect(useGameStore.getState().scores.X).toBe(1)
    })
  })

  describe('resetScores', () => {
    it('should reset all scores to zero', () => {
      const store = useGameStore.getState()
      // Play some games
      act(() => {
        store.makeMove(0)
        store.makeMove(3)
        store.makeMove(1)
        store.makeMove(4)
        store.makeMove(2)
      })
      expect(useGameStore.getState().scores.X).toBe(1)

      act(() => {
        store.resetScores()
      })
      expect(useGameStore.getState().scores).toEqual({ X: 0, O: 0, draws: 0 })
    })
  })

  describe('setGameMode', () => {
    it('should change game mode and reset game', () => {
      const store = useGameStore.getState()
      act(() => {
        store.setGameMode('ai')
      })
      expect(useGameStore.getState().gameMode).toBe('ai')
      expect(useGameStore.getState().board).toEqual(Array(9).fill(null))
    })

    it('should default to medium difficulty', () => {
      expect(useGameStore.getState().difficulty).toBe('medium')
    })
  })

  describe('setDifficulty', () => {
    it('should change difficulty without resetting game', () => {
      const store = useGameStore.getState()
      act(() => {
        store.makeMove(0) // Make a move first
      })
      expect(useGameStore.getState().board[0]).toBe('X')

      act(() => {
        store.setDifficulty('hard')
      })
      expect(useGameStore.getState().difficulty).toBe('hard')
      // Move should still be there
      expect(useGameStore.getState().board[0]).toBe('X')
    })
  })
})
