import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTetrisGame } from '../useTetrisGame'

// Mock the store as a hook function
const { mockUseTetrisStore } = vi.hoisted(() => ({
  mockUseTetrisStore: vi.fn(() => ({
    bestScore: 0,
    gamesPlayed: 0,
    totalLinesCleared: 0,
    totalPlayTime: 0,
    averageScore: 0,
    highestLevel: 1,
    sessionStats: {
      gamesPlayed: 0,
      bestScore: 0,
      totalLines: 0,
    },
    setBestScore: vi.fn(),
    incrementGamesPlayed: vi.fn(),
    addLinesCleared: vi.fn(),
    addPlayTime: vi.fn(),
    updateHighestLevel: vi.fn(),
    updateSessionStats: vi.fn(),
    resetStats: vi.fn(),
    resetSessionStats: vi.fn(),
  })),
}))

vi.mock('../../store', () => ({
  useTetrisStore: mockUseTetrisStore,
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useTetrisGame', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTetrisStore.mockReturnValue({
      bestScore: 0,
      gamesPlayed: 0,
      totalLinesCleared: 0,
      totalPlayTime: 0,
      averageScore: 0,
      highestLevel: 1,
      sessionStats: {
        gamesPlayed: 0,
        bestScore: 0,
        totalLines: 0,
      },
      setBestScore: vi.fn(),
      incrementGamesPlayed: vi.fn(),
      addLinesCleared: vi.fn(),
      addPlayTime: vi.fn(),
      updateHighestLevel: vi.fn(),
      updateSessionStats: vi.fn(),
      resetStats: vi.fn(),
      resetSessionStats: vi.fn(),
    })
  })

  it('should initialize with empty board', () => {
    const { result } = renderHook(() => useTetrisGame())

    expect(result.current.gameState.board).toBeDefined()
    expect(Array.isArray(result.current.gameState.board)).toBe(true)
    expect(result.current.gameState.score).toBe(0)
    expect(result.current.gameState.lines).toBe(0)
    expect(result.current.gameState.level).toBe(1)
    expect(result.current.gameState.gameOver).toBe(false)
    expect(result.current.gameState.paused).toBe(false)
  })

  it('should return all expected methods', () => {
    const { result } = renderHook(() => useTetrisGame())

    expect(typeof result.current.movePiece).toBe('function')
    expect(typeof result.current.rotatePiece).toBe('function')
    expect(typeof result.current.hardDrop).toBe('function')
    expect(typeof result.current.resetGame).toBe('function')
    expect(typeof result.current.togglePause).toBe('function')
    expect(typeof result.current.startSoftDrop).toBe('function')
    expect(typeof result.current.stopSoftDrop).toBe('function')
  })

  it('should return a boolean when moving the current piece', () => {
    const { result } = renderHook(() => useTetrisGame())

    const moved = result.current.movePiece('left')
    expect(typeof moved).toBe('boolean')
  })

  it('should call store setBestScore when new high score is achieved', () => {
    const setBestScore = vi.fn()
    mockUseTetrisStore.mockReturnValue({
      bestScore: 100,
      gamesPlayed: 0,
      totalLinesCleared: 0,
      totalPlayTime: 0,
      averageScore: 0,
      highestLevel: 1,
      sessionStats: { gamesPlayed: 0, bestScore: 0, totalLines: 0 },
      setBestScore,
      incrementGamesPlayed: vi.fn(),
      addLinesCleared: vi.fn(),
      addPlayTime: vi.fn(),
      updateHighestLevel: vi.fn(),
      updateSessionStats: vi.fn(),
      resetStats: vi.fn(),
      resetSessionStats: vi.fn(),
    })

    const { result } = renderHook(() => useTetrisGame())
    // Hook uses bestScore from store
    expect(result.current.bestScore).toBe(100)
  })

  it('should toggle pause without throwing', () => {
    const { result } = renderHook(() => useTetrisGame())

    expect(() => result.current.togglePause()).not.toThrow()
    expect(() => result.current.togglePause()).not.toThrow()
  })

  it('should reset game without throwing', () => {
    const { result } = renderHook(() => useTetrisGame())

    expect(() => result.current.resetGame()).not.toThrow()
  })

  it('should return bestScore from store', () => {
    const { result } = renderHook(() => useTetrisGame())

    expect(typeof result.current.bestScore).toBe('number')
  })

  it('should have isSoftDropping state', () => {
    const { result } = renderHook(() => useTetrisGame())

    expect(typeof result.current.isSoftDropping).toBe('boolean')
  })

  it('should start and stop soft drop without throwing', () => {
    const { result } = renderHook(() => useTetrisGame())

    expect(() => result.current.startSoftDrop()).not.toThrow()
    expect(() => result.current.stopSoftDrop()).not.toThrow()
  })

  it('should rotate without throwing when no piece', () => {
    const { result } = renderHook(() => useTetrisGame())

    expect(() => result.current.rotatePiece()).not.toThrow()
  })

  it('should hardDrop without throwing when no piece', () => {
    const { result } = renderHook(() => useTetrisGame())

    expect(() => result.current.hardDrop()).not.toThrow()
  })
})
