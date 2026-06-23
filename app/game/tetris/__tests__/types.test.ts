import { describe, expect, it } from 'vitest'
import type { TetrominoType, Position, Board, Tetromino, GameState, GameConfig } from '../types'

describe('tetris types', () => {
  it('should allow TetrominoType values', () => {
    const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
    types.forEach(type => {
      const t: TetrominoType = type
      expect(t).toBe(type)
    })
  })

  it('should allow Position', () => {
    const pos: Position = { x: 3, y: 5 }
    expect(pos.x).toBe(3)
    expect(pos.y).toBe(5)
  })

  it('should allow Board type', () => {
    const board: Board = Array(20)
      .fill(null)
      .map(() => Array(10).fill(null))
    expect(board).toHaveLength(20)
    expect(board[0]).toHaveLength(10)
  })

  it('should allow Board with filled cells', () => {
    const board: Board = Array(20)
      .fill(null)
      .map(() => Array(10).fill(null))
    board[19][0] = '#f97316'
    expect(board[19][0]).toBe('#f97316')
  })

  it('should allow Tetromino', () => {
    const tetromino: Tetromino = {
      type: 'T',
      shape: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      position: { x: 3, y: 0 },
      color: '#a78bfa',
    }
    expect(tetromino.type).toBe('T')
    expect(tetromino.position.x).toBe(3)
  })

  it('should allow GameState', () => {
    const state: GameState = {
      board: Array(20)
        .fill(null)
        .map(() => Array(10).fill(null)),
      currentPiece: null,
      nextPiece: null,
      score: 0,
      lines: 0,
      level: 1,
      gameOver: false,
      paused: false,
      isClient: false,
    }
    expect(state.score).toBe(0)
    expect(state.gameOver).toBe(false)
  })

  it('should allow GameState with pieces', () => {
    const state: GameState = {
      board: Array(20)
        .fill(null)
        .map(() => Array(10).fill(null)),
      currentPiece: {
        type: 'I',
        shape: [
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        position: { x: 3, y: 0 },
        color: '#f97316',
      },
      nextPiece: {
        type: 'O',
        shape: [
          [1, 1],
          [1, 1],
        ],
        position: { x: 4, y: 0 },
        color: '#facc15',
      },
      score: 100,
      lines: 2,
      level: 1,
      gameOver: false,
      paused: false,
      isClient: true,
    }
    expect(state.currentPiece?.type).toBe('I')
    expect(state.nextPiece?.type).toBe('O')
    expect(state.score).toBe(100)
  })

  it('should allow GameConfig', () => {
    const config: GameConfig = {
      BOARD_WIDTH: 10,
      BOARD_HEIGHT: 20,
      TETROMINO_SHAPES: {
        I: [
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
      },
      TETROMINO_COLORS: {
        I: '#f97316',
      },
    }
    expect(config.BOARD_WIDTH).toBe(10)
    expect(config.TETROMINO_SHAPES.I).toBeDefined()
  })
})
