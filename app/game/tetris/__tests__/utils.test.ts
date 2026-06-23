import { describe, expect, it } from 'vitest'
import {
  createEmptyBoard,
  generateRandomTetromino,
  rotateTetromino,
  isValidPosition,
  placeTetromino,
  clearLines,
  calculateScore,
  calculateLevel,
  getDropSpeed,
  calculateHardDropDistance,
  createDisplayBoard,
} from '../utils'
import { TETROMINO_SHAPES, BOARD_WIDTH, BOARD_HEIGHT, SCORING, GAME_SPEED } from '../constants'
import type { Board, Tetromino, Position } from '../types'

describe('tetris utils', () => {
  describe('createEmptyBoard', () => {
    it('should create board with correct dimensions', () => {
      const board = createEmptyBoard()
      expect(board).toHaveLength(BOARD_HEIGHT)
      board.forEach(row => {
        expect(row).toHaveLength(BOARD_WIDTH)
      })
    })

    it('should fill all cells with null', () => {
      const board = createEmptyBoard()
      board.forEach(row => {
        row.forEach(cell => {
          expect(cell).toBeNull()
        })
      })
    })
  })

  describe('generateRandomTetromino', () => {
    it('should generate a valid tetromino', () => {
      const piece = generateRandomTetromino()
      expect(piece.type).toBeDefined()
      expect(piece.shape).toBeDefined()
      expect(piece.position).toBeDefined()
      expect(piece.color).toBeDefined()
    })

    it('should generate piece with valid starting position', () => {
      const piece = generateRandomTetromino()
      expect(piece.position.y).toBe(0)
      expect(typeof piece.position.x).toBe('number')
    })

    it('should generate different types across multiple calls', () => {
      const types = new Set<string>()
      for (let i = 0; i < 50; i++) {
        types.add(generateRandomTetromino().type)
      }
      // Should generate at least a few different types
      expect(types.size).toBeGreaterThan(1)
    })
  })

  describe('rotateTetromino', () => {
    it('should rotate T shape correctly', () => {
      const original = {
        type: 'T' as const,
        shape: [
          [0, 1, 0],
          [1, 1, 1],
          [0, 0, 0],
        ],
        position: { x: 0, y: 0 },
        color: '#a78bfa',
      }

      const rotated = rotateTetromino(original)
      // Rotation: transpose + reverse rows
      expect(rotated.shape).toEqual([
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0],
      ])
    })

    it('should preserve type, position, and color on rotation', () => {
      const original = {
        type: 'L' as const,
        shape: TETROMINO_SHAPES.L,
        position: { x: 3, y: 1 } as Position,
        color: '#a3e635',
      }

      const rotated = rotateTetromino(original)
      expect(rotated.type).toBe('L')
      expect(rotated.position).toEqual({ x: 3, y: 1 })
      expect(rotated.color).toBe('#a3e635')
    })
  })

  describe('isValidPosition', () => {
    it('should return true for empty position', () => {
      const board = createEmptyBoard()
      const piece: Tetromino = {
        type: 'O',
        shape: [
          [1, 1],
          [1, 1],
        ],
        position: { x: 4, y: 0 },
        color: '#facc15',
      }

      expect(isValidPosition(board, piece, { x: 4, y: 0 })).toBe(true)
    })

    it('should return false when piece is out of bounds left', () => {
      const board = createEmptyBoard()
      const piece: Tetromino = {
        type: 'O',
        shape: [
          [1, 1],
          [1, 1],
        ],
        position: { x: 0, y: 0 },
        color: '#facc15',
      }

      expect(isValidPosition(board, piece, { x: -1, y: 0 })).toBe(false)
    })

    it('should return false when piece is out of bounds right', () => {
      const board = createEmptyBoard()
      const piece: Tetromino = {
        type: 'O',
        shape: [
          [1, 1],
          [1, 1],
        ],
        position: { x: 8, y: 0 },
        color: '#facc15',
      }

      expect(isValidPosition(board, piece, { x: 9, y: 0 })).toBe(false)
    })

    it('should return false when piece overlaps with existing cells', () => {
      const board: Board = Array(20)
        .fill(null)
        .map(() => Array(10).fill(null))
      board[0][4] = '#ff0000'

      const piece: Tetromino = {
        type: 'O',
        shape: [
          [1, 1],
          [1, 1],
        ],
        position: { x: 4, y: 0 },
        color: '#facc15',
      }

      expect(isValidPosition(board, piece, { x: 4, y: 0 })).toBe(false)
    })
  })

  describe('placeTetromino', () => {
    it('should place piece on board', () => {
      const board = createEmptyBoard()
      const piece: Tetromino = {
        type: 'O',
        shape: [
          [1, 1],
          [1, 1],
        ],
        position: { x: 4, y: 0 },
        color: '#facc15',
      }

      const newBoard = placeTetromino(board, piece)
      expect(newBoard[0][4]).toBe('#facc15')
      expect(newBoard[0][5]).toBe('#facc15')
      expect(newBoard[1][4]).toBe('#facc15')
      expect(newBoard[1][5]).toBe('#facc15')
    })

    it('should not mutate original board', () => {
      const board = createEmptyBoard()
      const piece: Tetromino = {
        type: 'O',
        shape: [
          [1, 1],
          [1, 1],
        ],
        position: { x: 4, y: 0 },
        color: '#facc15',
      }

      placeTetromino(board, piece)
      expect(board[0][4]).toBeNull()
    })
  })

  describe('clearLines', () => {
    it('should clear full rows', () => {
      const board: Board = Array(20)
        .fill(null)
        .map(() => Array(10).fill(null))
      // Fill the bottom row
      for (let x = 0; x < 10; x++) {
        board[19][x] = '#ff0000'
      }

      const { newBoard, linesCleared } = clearLines(board)
      expect(linesCleared).toBe(1)
      expect(newBoard[19]).toEqual(Array(10).fill(null))
    })

    it('should not clear partial rows', () => {
      const board: Board = Array(20)
        .fill(null)
        .map(() => Array(10).fill(null))
      // Fill only 9 cells in bottom row
      for (let x = 0; x < 9; x++) {
        board[19][x] = '#ff0000'
      }

      const { newBoard, linesCleared } = clearLines(board)
      expect(linesCleared).toBe(0)
    })

    it('should clear multiple rows', () => {
      const board: Board = Array(20)
        .fill(null)
        .map(() => Array(10).fill(null))
      for (let x = 0; x < 10; x++) {
        board[18][x] = '#ff0000'
        board[19][x] = '#ff0000'
      }

      const { linesCleared } = clearLines(board)
      expect(linesCleared).toBe(2)
    })

    it('should maintain board height after clearing', () => {
      const board: Board = Array(20)
        .fill(null)
        .map(() => Array(10).fill(null))
      for (let x = 0; x < 10; x++) {
        board[19][x] = '#ff0000'
      }

      const { newBoard } = clearLines(board)
      expect(newBoard).toHaveLength(20)
    })
  })

  describe('calculateScore', () => {
    it('should return 0 for 0 lines', () => {
      expect(calculateScore(0, 0)).toBe(0)
    })

    it('should calculate score for single line', () => {
      expect(calculateScore(1, 0)).toBe(40)
    })

    it('should calculate score for double', () => {
      expect(calculateScore(2, 0)).toBe(100)
    })

    it('should calculate score for triple', () => {
      expect(calculateScore(3, 0)).toBe(300)
    })

    it('should calculate score for tetris', () => {
      expect(calculateScore(4, 0)).toBe(1200)
    })

    it('should scale score with level', () => {
      expect(calculateScore(1, 1)).toBe(80)
      expect(calculateScore(4, 1)).toBe(2400)
      expect(calculateScore(1, 5)).toBe(240)
    })
  })

  describe('calculateLevel', () => {
    it('should return level 1 for 0-9 lines', () => {
      expect(calculateLevel(0)).toBe(1)
      expect(calculateLevel(9)).toBe(1)
    })

    it('should return level 2 for 10 lines', () => {
      expect(calculateLevel(10)).toBe(2)
    })

    it('should return level 3 for 20 lines', () => {
      expect(calculateLevel(20)).toBe(3)
    })
  })

  describe('getDropSpeed', () => {
    it('should return base speed for level 1', () => {
      expect(getDropSpeed(1)).toBe(GAME_SPEED.BASE_DROP_SPEED)
    })

    it('should decrease speed with higher levels', () => {
      const level1Speed = getDropSpeed(1)
      const level2Speed = getDropSpeed(2)
      expect(level2Speed).toBeLessThan(level1Speed)
    })

    it('should not go below minimum drop speed', () => {
      const veryHighLevelSpeed = getDropSpeed(100)
      expect(veryHighLevelSpeed).toBeGreaterThanOrEqual(GAME_SPEED.MIN_DROP_SPEED)
    })
  })

  describe('calculateHardDropDistance', () => {
    it('should return 0 when piece is already at bottom boundary', () => {
      const board = createEmptyBoard()
      // O piece at y=18 occupies rows 18+19; dropping to y=19 would need row 20 (out of bounds)
      const piece: Tetromino = {
        type: 'O',
        shape: [
          [1, 1],
          [1, 1],
        ],
        position: { x: 4, y: 18 },
        color: '#facc15',
      }

      // The O piece at y=18: shape row 1 at board y=19 is valid, but shape row 1 at y=20 is OOB
      expect(calculateHardDropDistance(board, piece)).toBe(0)
    })

    it('should return 0 when piece is blocked by another piece at bottom', () => {
      const board: Board = Array(20)
        .fill(null)
        .map(() => Array(10).fill(null))
      board[19][5] = '#ff0000'
      const piece: Tetromino = {
        type: 'O',
        shape: [
          [1, 1],
          [1, 1],
        ],
        position: { x: 4, y: 17 },
        color: '#facc15',
      }

      // O piece at y=17: can drop to y=18 (row 18 empty), but dropping to y=19
      // would place shape row 1 at board row 20 (out of bounds)
      expect(calculateHardDropDistance(board, piece)).toBe(0)
    })

    it('should return correct drop distance on empty board', () => {
      const board = createEmptyBoard()
      // Single-cell I piece at y=0 can drop all the way to row 19
      const piece: Tetromino = {
        type: 'I',
        shape: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 0, 0],
        ],
        position: { x: 3, y: 0 },
        color: '#f97316',
      }

      expect(calculateHardDropDistance(board, piece)).toBeGreaterThan(0)
    })

    it('should return correct distance for empty board', () => {
      const board = createEmptyBoard()
      const piece: Tetromino = {
        type: 'O',
        shape: [
          [1, 1],
          [1, 1],
        ],
        position: { x: 4, y: 0 },
        color: '#facc15',
      }

      expect(calculateHardDropDistance(board, piece)).toBe(18)
    })
  })

  describe('createDisplayBoard', () => {
    it('should include current piece on board', () => {
      const board = createEmptyBoard()
      const piece: Tetromino = {
        type: 'O',
        shape: [
          [1, 1],
          [1, 1],
        ],
        position: { x: 4, y: 0 },
        color: '#facc15',
      }

      const displayBoard = createDisplayBoard(board, piece)
      expect(displayBoard[0][4]).toBe('#facc15')
      expect(displayBoard[1][4]).toBe('#facc15')
    })

    it('should not mutate original board', () => {
      const board = createEmptyBoard()
      const piece: Tetromino = {
        type: 'O',
        shape: [
          [1, 1],
          [1, 1],
        ],
        position: { x: 4, y: 0 },
        color: '#facc15',
      }

      createDisplayBoard(board, piece)
      expect(board[0][4]).toBeNull()
    })

    it('should return copy when no current piece', () => {
      const board = createEmptyBoard()
      const displayBoard = createDisplayBoard(board, null)
      expect(displayBoard).not.toBe(board)
    })
  })
})
