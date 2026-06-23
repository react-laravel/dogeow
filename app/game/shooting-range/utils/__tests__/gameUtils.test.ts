import { describe, expect, it } from 'vitest'
import { generateRandomPosition, generateRandomDirection, difficultySettings } from '../gameUtils'

describe('shooting-range gameUtils', () => {
  describe('generateRandomPosition', () => {
    it('should return a 3-tuple', () => {
      const pos = generateRandomPosition(20)
      expect(pos).toHaveLength(3)
    })

    it('should return numbers', () => {
      const pos = generateRandomPosition(20)
      expect(typeof pos[0]).toBe('number')
      expect(typeof pos[1]).toBe('number')
      expect(typeof pos[2]).toBe('number')
    })

    it('should generate positions within game area bounds', () => {
      const gameAreaSize = 20
      for (let i = 0; i < 100; i++) {
        const [x, y, z] = generateRandomPosition(gameAreaSize)
        expect(Math.abs(x)).toBeLessThanOrEqual(gameAreaSize / 2)
        expect(y).toBeGreaterThanOrEqual(-gameAreaSize / 4 + 2)
        expect(y).toBeLessThanOrEqual(gameAreaSize / 4 + 2)
      }
    })

    it('should scale with game area size', () => {
      const posSmall = generateRandomPosition(10)
      const posLarge = generateRandomPosition(40)

      // Both should have valid coordinates
      expect(posSmall.every(n => typeof n === 'number' && !isNaN(n))).toBe(true)
      expect(posLarge.every(n => typeof n === 'number' && !isNaN(n))).toBe(true)
    })
  })

  describe('generateRandomDirection', () => {
    it('should return a 3-tuple', () => {
      const dir = generateRandomDirection()
      expect(dir).toHaveLength(3)
    })

    it('should return normalized vector (length ≈ 1)', () => {
      for (let i = 0; i < 50; i++) {
        const [x, y, z] = generateRandomDirection()
        const length = Math.sqrt(x ** 2 + y ** 2 + z ** 2)
        expect(length).toBeCloseTo(1, 5)
      }
    })

    it('should return numbers', () => {
      const dir = generateRandomDirection()
      expect(typeof dir[0]).toBe('number')
      expect(typeof dir[1]).toBe('number')
      expect(typeof dir[2]).toBe('number')
    })
  })

  describe('difficultySettings', () => {
    it('should have easy, medium, and hard settings', () => {
      expect(difficultySettings.easy).toBeDefined()
      expect(difficultySettings.medium).toBeDefined()
      expect(difficultySettings.hard).toBeDefined()
    })

    it('should have correct easy settings', () => {
      expect(difficultySettings.easy.targetCount).toBe(8)
      expect(difficultySettings.easy.targetSpeed).toBe(0.01)
      expect(difficultySettings.easy.gameAreaSize).toBe(20)
    })

    it('should have correct medium settings', () => {
      expect(difficultySettings.medium.targetCount).toBe(12)
      expect(difficultySettings.medium.targetSpeed).toBe(0.02)
      expect(difficultySettings.medium.gameAreaSize).toBe(25)
    })

    it('should have correct hard settings', () => {
      expect(difficultySettings.hard.targetCount).toBe(16)
      expect(difficultySettings.hard.targetSpeed).toBe(0.05)
      expect(difficultySettings.hard.gameAreaSize).toBe(30)
    })

    it('should have increasing difficulty', () => {
      expect(difficultySettings.hard.targetCount).toBeGreaterThan(
        difficultySettings.medium.targetCount
      )
      expect(difficultySettings.medium.targetCount).toBeGreaterThan(
        difficultySettings.easy.targetCount
      )
      expect(difficultySettings.hard.targetSpeed).toBeGreaterThan(
        difficultySettings.medium.targetSpeed
      )
      expect(difficultySettings.medium.targetSpeed).toBeGreaterThan(
        difficultySettings.easy.targetSpeed
      )
      expect(difficultySettings.hard.gameAreaSize).toBeGreaterThan(
        difficultySettings.medium.gameAreaSize
      )
      expect(difficultySettings.medium.gameAreaSize).toBeGreaterThan(
        difficultySettings.easy.gameAreaSize
      )
    })
  })
})
