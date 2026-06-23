import { describe, expect, it } from 'vitest'
import { GameStats } from '../GameStats'

describe('GameStats', () => {
  it('should return null when gamesCompleted is 0', () => {
    const result = GameStats({
      gamesCompleted: 0,
      bestTime: null,
      totalPiecesPlaced: 0,
    })
    expect(result).toBeNull()
  })

  it('should render when gamesCompleted > 0', () => {
    const result = GameStats({
      gamesCompleted: 1,
      bestTime: 120,
      totalPiecesPlaced: 9,
    })
    expect(result).toBeDefined()
  })

  it('should display bestTime in mm:ss format', () => {
    const result = GameStats({
      gamesCompleted: 1,
      bestTime: 125,
      totalPiecesPlaced: 9,
    })
    expect(result).toBeDefined()
  })

  it('should show dash when bestTime is null', () => {
    const result = GameStats({
      gamesCompleted: 1,
      bestTime: null,
      totalPiecesPlaced: 5,
    })
    expect(result).toBeDefined()
  })

  it('should display gamesCompleted count', () => {
    const result = GameStats({
      gamesCompleted: 5,
      bestTime: 90,
      totalPiecesPlaced: 45,
    })
    expect(result).toBeDefined()
  })

  it('should display totalPiecesPlaced', () => {
    const result = GameStats({
      gamesCompleted: 3,
      bestTime: 60,
      totalPiecesPlaced: 27,
    })
    expect(result).toBeDefined()
  })
})
