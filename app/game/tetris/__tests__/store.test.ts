import { describe, expect, it } from 'vitest'
import { useTetrisStore } from '../store'

describe('tetris store', () => {
  it('should have initial state values', () => {
    const state = useTetrisStore.getState()

    expect(state.bestScore).toBe(0)
    expect(state.gamesPlayed).toBe(0)
    expect(state.totalLinesCleared).toBe(0)
    expect(state.totalPlayTime).toBe(0)
    expect(state.averageScore).toBe(0)
    expect(state.highestLevel).toBe(1)
  })

  it('should have session stats in initial state', () => {
    const state = useTetrisStore.getState()

    expect(state.sessionStats.gamesPlayed).toBe(0)
    expect(state.sessionStats.bestScore).toBe(0)
    expect(state.sessionStats.totalLines).toBe(0)
  })

  it('should have all action methods', () => {
    const state = useTetrisStore.getState()

    expect(typeof state.setBestScore).toBe('function')
    expect(typeof state.incrementGamesPlayed).toBe('function')
    expect(typeof state.addLinesCleared).toBe('function')
    expect(typeof state.addPlayTime).toBe('function')
    expect(typeof state.updateHighestLevel).toBe('function')
    expect(typeof state.updateSessionStats).toBe('function')
    expect(typeof state.resetStats).toBe('function')
    expect(typeof state.resetSessionStats).toBe('function')
  })

  it('should set best score', () => {
    useTetrisStore.setState({ bestScore: 0 })
    useTetrisStore.getState().setBestScore(100)
    expect(useTetrisStore.getState().bestScore).toBe(100)
  })

  it('should not lower best score', () => {
    useTetrisStore.setState({ bestScore: 200 })
    useTetrisStore.getState().setBestScore(100)
    expect(useTetrisStore.getState().bestScore).toBe(200)
  })

  it('should increment games played', () => {
    useTetrisStore.setState({
      gamesPlayed: 0,
      averageScore: 0,
      sessionStats: { gamesPlayed: 0, bestScore: 0, totalLines: 0 },
    })

    useTetrisStore.getState().incrementGamesPlayed()

    expect(useTetrisStore.getState().gamesPlayed).toBe(1)
    expect(useTetrisStore.getState().sessionStats.gamesPlayed).toBe(1)
  })

  it('should calculate average score', () => {
    useTetrisStore.setState({
      gamesPlayed: 2,
      averageScore: 100,
      bestScore: 200,
      sessionStats: { gamesPlayed: 0, bestScore: 0, totalLines: 0 },
    })

    useTetrisStore.getState().incrementGamesPlayed()

    expect(useTetrisStore.getState().gamesPlayed).toBe(3)
    expect(useTetrisStore.getState().averageScore).toBe(Math.round((100 * 2 + 200) / 3))
  })

  it('should add lines cleared', () => {
    useTetrisStore.setState({
      totalLinesCleared: 10,
      sessionStats: { gamesPlayed: 0, bestScore: 0, totalLines: 10 },
    })

    useTetrisStore.getState().addLinesCleared(4)

    expect(useTetrisStore.getState().totalLinesCleared).toBe(14)
    expect(useTetrisStore.getState().sessionStats.totalLines).toBe(14)
  })

  it('should add play time', () => {
    useTetrisStore.setState({ totalPlayTime: 0 })

    useTetrisStore.getState().addPlayTime(120)

    expect(useTetrisStore.getState().totalPlayTime).toBe(120)
  })

  it('should update highest level', () => {
    useTetrisStore.setState({ highestLevel: 5 })

    useTetrisStore.getState().updateHighestLevel(10)

    expect(useTetrisStore.getState().highestLevel).toBe(10)
  })

  it('should not lower highest level', () => {
    useTetrisStore.setState({ highestLevel: 10 })

    useTetrisStore.getState().updateHighestLevel(5)

    expect(useTetrisStore.getState().highestLevel).toBe(10)
  })

  it('should update session stats', () => {
    useTetrisStore.setState({
      sessionStats: { gamesPlayed: 0, bestScore: 0, totalLines: 0 },
    })

    useTetrisStore.getState().updateSessionStats(500)

    expect(useTetrisStore.getState().sessionStats.bestScore).toBe(500)
  })

  it('should not lower session best score', () => {
    useTetrisStore.setState({
      sessionStats: { gamesPlayed: 0, bestScore: 300, totalLines: 0 },
    })

    useTetrisStore.getState().updateSessionStats(200)

    expect(useTetrisStore.getState().sessionStats.bestScore).toBe(300)
  })

  it('should reset all stats', () => {
    useTetrisStore.setState({
      bestScore: 500,
      gamesPlayed: 10,
      totalLinesCleared: 50,
      totalPlayTime: 300,
      averageScore: 50,
      highestLevel: 5,
    })

    useTetrisStore.getState().resetStats()

    expect(useTetrisStore.getState().bestScore).toBe(0)
    expect(useTetrisStore.getState().gamesPlayed).toBe(0)
    expect(useTetrisStore.getState().totalLinesCleared).toBe(0)
    expect(useTetrisStore.getState().totalPlayTime).toBe(0)
    expect(useTetrisStore.getState().averageScore).toBe(0)
    expect(useTetrisStore.getState().highestLevel).toBe(1)
  })

  it('should reset only session stats', () => {
    useTetrisStore.setState({
      bestScore: 500,
      gamesPlayed: 10,
      sessionStats: { gamesPlayed: 3, bestScore: 200, totalLines: 20 },
    })

    useTetrisStore.getState().resetSessionStats()

    expect(useTetrisStore.getState().sessionStats.gamesPlayed).toBe(0)
    expect(useTetrisStore.getState().sessionStats.bestScore).toBe(0)
    expect(useTetrisStore.getState().sessionStats.totalLines).toBe(0)
    // Non-session stats should be preserved
    expect(useTetrisStore.getState().bestScore).toBe(500)
  })
})
