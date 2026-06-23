import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useJigsawStats } from '../useJigsawStats'

describe('useJigsawStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should initialize with default stats', () => {
    const { result } = renderHook(() => useJigsawStats(3))

    expect(result.current.stats.bestTime).toBeNull()
    expect(result.current.stats.gamesCompleted).toBe(0)
    expect(result.current.stats.totalPiecesPlaced).toBe(0)
  })

  it('should use difficulty-specific storage key', () => {
    const { result: result3 } = renderHook(() => useJigsawStats(3))
    const { result: result4 } = renderHook(() => useJigsawStats(4))

    // Different difficulties should have independent state
    expect(result3.current.stats.gamesCompleted).toBe(0)
    expect(result4.current.stats.gamesCompleted).toBe(0)
  })

  it('should update stats after game completion', () => {
    const { result } = renderHook(() => useJigsawStats(3))

    act(() => {
      result.current.updateStats(120, 9)
    })

    expect(result.current.stats.bestTime).toBe(120)
    expect(result.current.stats.gamesCompleted).toBe(1)
    expect(result.current.stats.totalPiecesPlaced).toBe(9)
  })

  it('should track best time across multiple games', () => {
    const { result } = renderHook(() => useJigsawStats(3))

    act(() => {
      result.current.updateStats(120, 9)
    })

    expect(result.current.stats.bestTime).toBe(120)

    act(() => {
      result.current.updateStats(90, 9)
    })

    expect(result.current.stats.bestTime).toBe(90)
    expect(result.current.stats.gamesCompleted).toBe(2)
    expect(result.current.stats.totalPiecesPlaced).toBe(18)
  })

  it('should not update best time when new time is worse', () => {
    const { result } = renderHook(() => useJigsawStats(3))

    act(() => {
      result.current.updateStats(90, 9)
    })

    expect(result.current.stats.bestTime).toBe(90)

    act(() => {
      result.current.updateStats(120, 9)
    })

    expect(result.current.stats.bestTime).toBe(90)
  })

  it('should reset stats', () => {
    const { result } = renderHook(() => useJigsawStats(3))

    act(() => {
      result.current.updateStats(120, 9)
    })

    expect(result.current.stats.gamesCompleted).toBe(1)

    act(() => {
      result.current.resetStats()
    })

    expect(result.current.stats.bestTime).toBeNull()
    expect(result.current.stats.gamesCompleted).toBe(0)
    expect(result.current.stats.totalPiecesPlaced).toBe(0)
  })

  it('should load stats from localStorage on mount', () => {
    const savedStats = {
      bestTime: 100,
      gamesCompleted: 5,
      totalPiecesPlaced: 45,
    }
    localStorage.setItem('jigsaw-puzzle-stats-3x3', JSON.stringify(savedStats))

    const { result } = renderHook(() => useJigsawStats(3))

    expect(result.current.stats.bestTime).toBe(100)
    expect(result.current.stats.gamesCompleted).toBe(5)
    expect(result.current.stats.totalPiecesPlaced).toBe(45)
  })

  it('should handle invalid localStorage data gracefully', () => {
    localStorage.setItem('jigsaw-puzzle-stats-3x3', 'invalid-json')

    const { result } = renderHook(() => useJigsawStats(3))

    expect(result.current.stats.bestTime).toBeNull()
    expect(result.current.stats.gamesCompleted).toBe(0)
  })
})
