import { describe, expect, it } from 'vitest'
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TETROMINO_SHAPES,
  TETROMINO_COLORS,
  GAME_CONFIG,
  GAME_SPEED,
  SCORING,
} from '../constants'
import type { TetrominoType } from '../types'

describe('tetris constants', () => {
  describe('board dimensions', () => {
    it('should have correct BOARD_WIDTH', () => {
      expect(BOARD_WIDTH).toBe(10)
    })

    it('should have correct BOARD_HEIGHT', () => {
      expect(BOARD_HEIGHT).toBe(20)
    })
  })

  describe('TETROMINO_SHAPES', () => {
    it('should have all 7 tetromino types', () => {
      const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
      types.forEach(type => {
        expect(TETROMINO_SHAPES[type]).toBeDefined()
      })
    })

    it('should have I shape with 4 horizontal cells', () => {
      const shape = TETROMINO_SHAPES.I
      let count = 0
      shape.forEach(row =>
        row.forEach(cell => {
          if (cell) count++
        })
      )
      expect(count).toBe(4)
    })

    it('should have O shape as 2x2', () => {
      expect(TETROMINO_SHAPES.O).toHaveLength(2)
      expect(TETROMINO_SHAPES.O[0]).toHaveLength(2)
      expect(TETROMINO_SHAPES.O[1]).toHaveLength(2)
    })

    it('should have T shape with correct pattern', () => {
      const shape = TETROMINO_SHAPES.T
      expect(shape).toHaveLength(3)
      expect(shape[1]).toEqual([1, 1, 1])
    })

    it('should have S shape with correct pattern', () => {
      const shape = TETROMINO_SHAPES.S
      expect(shape[0]).toEqual([0, 1, 1])
      expect(shape[1]).toEqual([1, 1, 0])
    })

    it('should have Z shape with correct pattern', () => {
      const shape = TETROMINO_SHAPES.Z
      expect(shape[0]).toEqual([1, 1, 0])
      expect(shape[1]).toEqual([0, 1, 1])
    })

    it('should have J shape with correct pattern', () => {
      const shape = TETROMINO_SHAPES.J
      expect(shape[0]).toEqual([1, 0, 0])
      expect(shape[1]).toEqual([1, 1, 1])
    })

    it('should have L shape with correct pattern', () => {
      const shape = TETROMINO_SHAPES.L
      expect(shape[0]).toEqual([0, 0, 1])
      expect(shape[1]).toEqual([1, 1, 1])
    })
  })

  describe('TETROMINO_COLORS', () => {
    it('should have colors for all types', () => {
      const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
      types.forEach(type => {
        expect(TETROMINO_COLORS[type]).toBeDefined()
        expect(TETROMINO_COLORS[type]).toMatch(/^#/)
      })
    })

    it('should have distinct colors', () => {
      const colors = Object.values(TETROMINO_COLORS)
      const uniqueColors = new Set(colors)
      expect(uniqueColors.size).toBe(colors.length)
    })
  })

  describe('GAME_CONFIG', () => {
    it('should contain board dimensions', () => {
      expect(GAME_CONFIG.BOARD_WIDTH).toBe(10)
      expect(GAME_CONFIG.BOARD_HEIGHT).toBe(20)
    })

    it('should contain shapes and colors', () => {
      expect(GAME_CONFIG.TETROMINO_SHAPES).toBe(TETROMINO_SHAPES)
      expect(GAME_CONFIG.TETROMINO_COLORS).toBe(TETROMINO_COLORS)
    })
  })

  describe('GAME_SPEED', () => {
    it('should have NORMAL_DROP', () => {
      expect(GAME_SPEED.NORMAL_DROP).toBe(16)
    })

    it('should have SOFT_DROP', () => {
      expect(GAME_SPEED.SOFT_DROP).toBe(50)
    })

    it('should have MIN_DROP_SPEED', () => {
      expect(GAME_SPEED.MIN_DROP_SPEED).toBe(50)
    })

    it('should have SPEED_DECREASE_PER_LEVEL', () => {
      expect(GAME_SPEED.SPEED_DECREASE_PER_LEVEL).toBe(50)
    })

    it('should have BASE_DROP_SPEED', () => {
      expect(GAME_SPEED.BASE_DROP_SPEED).toBe(1000)
    })
  })

  describe('SCORING', () => {
    it('should have BASE_SCORES array', () => {
      expect(SCORING.BASE_SCORES).toHaveLength(5)
      expect(SCORING.BASE_SCORES[0]).toBe(0)
      expect(SCORING.BASE_SCORES[1]).toBe(40)
      expect(SCORING.BASE_SCORES[2]).toBe(100)
      expect(SCORING.BASE_SCORES[3]).toBe(300)
      expect(SCORING.BASE_SCORES[4]).toBe(1200)
    })

    it('should have SOFT_DROP_BONUS', () => {
      expect(SCORING.SOFT_DROP_BONUS).toBe(1)
    })

    it('should have HARD_DROP_BONUS', () => {
      expect(SCORING.HARD_DROP_BONUS).toBe(2)
    })

    it('should have LINES_PER_LEVEL', () => {
      expect(SCORING.LINES_PER_LEVEL).toBe(10)
    })
  })
})
