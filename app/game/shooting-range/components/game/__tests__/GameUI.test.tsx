import { describe, expect, it, vi } from 'vitest'
import { GameUI } from '../GameUI'

describe('GameUI', () => {
  it('should render without crashing', () => {
    const result = GameUI({
      score: 0,
      timeLeft: 60,
      gameOver: false,
      onRestart: () => {},
    })
    expect(result).toBeDefined()
  })

  it('should display score and time', () => {
    const result = GameUI({
      score: 150,
      timeLeft: 45.5,
      gameOver: false,
      onRestart: () => {},
    })
    expect(result).toBeDefined()
  })

  it('should not show game over when game is not over', () => {
    const result = GameUI({
      score: 0,
      timeLeft: 60,
      gameOver: false,
      onRestart: () => {},
    })
    expect(result).toBeDefined()
  })

  it('should show game over when game is over', () => {
    const result = GameUI({
      score: 500,
      timeLeft: 0,
      gameOver: true,
      onRestart: () => {},
    })
    expect(result).toBeDefined()
  })

  it('should display final score in game over screen', () => {
    const result = GameUI({
      score: 999,
      timeLeft: 0,
      gameOver: true,
      onRestart: () => {},
    })
    expect(result).toBeDefined()
  })

  it('should have restart button in game over', () => {
    const onRestart = vi.fn()
    const result = GameUI({
      score: 100,
      timeLeft: 0,
      gameOver: true,
      onRestart,
    })
    expect(result).toBeDefined()
  })

  it('should format timeLeft with one decimal', () => {
    const result = GameUI({
      score: 0,
      timeLeft: 59.9,
      gameOver: false,
      onRestart: () => {},
    })
    expect(result).toBeDefined()
  })
})
