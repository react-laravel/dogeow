import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePuzzleLayout } from '../usePuzzleLayout'

describe('usePuzzleLayout', () => {
  it('should calculate layout for 2x2 puzzle', () => {
    const pieces = [
      { id: 0, row: 0, col: 0, isPlaced: false },
      { id: 1, row: 0, col: 1, isPlaced: false },
      { id: 2, row: 1, col: 0, isPlaced: false },
      { id: 3, row: 1, col: 1, isPlaced: false },
    ]

    const { result } = renderHook(() =>
      usePuzzleLayout({
        pieces,
        size: 2,
        puzzleSize: 200,
        availableHeight: 800,
        showDebugInfo: false,
      })
    )

    expect(result.current.pieceSize).toBe(100)
    expect(result.current.colsPerRow).toBeLessThanOrEqual(4)
    expect(result.current.pieceGroups.length).toBeGreaterThan(0)
    expect(typeof result.current.toRoman).toBe('function')
  })

  it('should calculate layout for 4x4 puzzle', () => {
    const pieces = Array.from({ length: 16 }, (_, i) => ({
      id: i,
      row: Math.floor(i / 4),
      col: i % 4,
      isPlaced: false,
    }))

    const { result } = renderHook(() =>
      usePuzzleLayout({
        pieces,
        size: 4,
        puzzleSize: 400,
        availableHeight: 800,
        showDebugInfo: false,
      })
    )

    expect(result.current.pieceSize).toBe(100)
    expect(result.current.piecesPerPage).toBeGreaterThan(0)
  })

  it('should account for debug info height', () => {
    const pieces = [
      { id: 0, row: 0, col: 0, isPlaced: false },
      { id: 1, row: 0, col: 1, isPlaced: false },
    ]

    const { result: resultWithDebug } = renderHook(() =>
      usePuzzleLayout({
        pieces,
        size: 2,
        puzzleSize: 200,
        availableHeight: 800,
        showDebugInfo: true,
      })
    )

    const { result: resultWithoutDebug } = renderHook(() =>
      usePuzzleLayout({
        pieces,
        size: 2,
        puzzleSize: 200,
        availableHeight: 800,
        showDebugInfo: false,
      })
    )

    // With debug info, actualAvailableForGrid should be smaller
    expect(resultWithDebug.current.actualAvailableForGrid).toBeLessThanOrEqual(
      resultWithoutDebug.current.actualAvailableForGrid
    )
  })

  it('should include toRoman function', () => {
    const pieces = [{ id: 0, row: 0, col: 0, isPlaced: false }]

    const { result } = renderHook(() =>
      usePuzzleLayout({
        pieces,
        size: 1,
        puzzleSize: 100,
        availableHeight: 600,
        showDebugInfo: false,
      })
    )

    expect(typeof result.current.toRoman).toBe('function')
    expect(result.current.toRoman(1)).toBe('I')
    expect(result.current.toRoman(2)).toBe('II')
    expect(result.current.toRoman(3)).toBe('III')
    expect(result.current.toRoman(4)).toBe('IV')
    expect(result.current.toRoman(5)).toBe('V')
    expect(result.current.toRoman(10)).toBe('X')
  })

  it('should handle single page of pieces', () => {
    const pieces = [
      { id: 0, row: 0, col: 0, isPlaced: false },
      { id: 1, row: 0, col: 1, isPlaced: false },
    ]

    const { result } = renderHook(() =>
      usePuzzleLayout({
        pieces,
        size: 2,
        puzzleSize: 200,
        availableHeight: 1000,
        showDebugInfo: false,
      })
    )

    expect(result.current.pieceGroups.length).toBe(1)
  })

  it('should calculate selectionPieceSize within bounds', () => {
    const pieces = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      row: Math.floor(i / 5),
      col: i % 5,
      isPlaced: false,
    }))

    const { result } = renderHook(() =>
      usePuzzleLayout({
        pieces,
        size: 5,
        puzzleSize: 500,
        availableHeight: 800,
        showDebugInfo: false,
      })
    )

    expect(result.current.selectionPieceSize).toBeGreaterThanOrEqual(60)
    expect(result.current.selectionPieceSize).toBeLessThanOrEqual(80)
  })
})
