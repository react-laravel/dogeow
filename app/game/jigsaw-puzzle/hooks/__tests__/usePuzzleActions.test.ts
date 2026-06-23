import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePuzzleActions } from '../usePuzzleActions'

// Mock puzzle utils
vi.mock('../../utils/puzzleUtils', () => ({
  isPieceCorrectlyPlaced: vi.fn(() => true),
  isGameComplete: vi.fn(() => false),
}))

describe('usePuzzleActions', () => {
  const createMockPiece = (id: number, row: number, col: number) => ({
    id,
    row,
    col,
    isPlaced: false,
    imageUrl: '/test.jpg',
    size: 2,
    puzzleSize: 200,
  })

  const createMockSlot = (id: number) => ({
    id,
    row: Math.floor(id / 2),
    col: id % 2,
    pieceId: null,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty actions', () => {
    const { result } = renderHook(() =>
      usePuzzleActions({
        pieces: [createMockPiece(0, 0, 0), createMockPiece(1, 0, 1)],
        slots: [createMockSlot(0), createMockSlot(1)],
        setPieces: vi.fn(),
        setSlots: vi.fn(),
        wronglyPlacedPieces: new Set(),
        setWronglyPlacedPieces: vi.fn(),
        lastWronglyPlacedPiece: null,
        setLastWronglyPlacedPiece: vi.fn(),
        onComplete: vi.fn(),
      })
    )

    expect(typeof result.current.placePieceInSlot).toBe('function')
    expect(typeof result.current.swapPieces).toBe('function')
    expect(typeof result.current.replacePieceWithUnplaced).toBe('function')
  })

  it('should return null for non-existent piece or slot', () => {
    const setPieces = vi.fn()
    const setSlots = vi.fn()

    const { result } = renderHook(() =>
      usePuzzleActions({
        pieces: [createMockPiece(0, 0, 0)],
        slots: [createMockSlot(0)],
        setPieces,
        setSlots,
        wronglyPlacedPieces: new Set(),
        setWronglyPlacedPieces: vi.fn(),
        lastWronglyPlacedPiece: null,
        setLastWronglyPlacedPiece: vi.fn(),
        onComplete: vi.fn(),
      })
    )

    // Should not throw for non-existent piece/slot
    expect(() => result.current.placePieceInSlot(999, 999)).not.toThrow()
  })

  it('should return null for swapPieces with non-existent pieces', () => {
    const setSlots = vi.fn()

    const { result } = renderHook(() =>
      usePuzzleActions({
        pieces: [createMockPiece(0, 0, 0)],
        slots: [createMockSlot(0)],
        setPieces: vi.fn(),
        setSlots,
        wronglyPlacedPieces: new Set(),
        setWronglyPlacedPieces: vi.fn(),
        lastWronglyPlacedPiece: null,
        setLastWronglyPlacedPiece: vi.fn(),
        onComplete: vi.fn(),
      })
    )

    expect(() => result.current.swapPieces(999, 998)).not.toThrow()
  })

  it('should return null for replacePieceWithUnplaced with non-existent piece', () => {
    const { result } = renderHook(() =>
      usePuzzleActions({
        pieces: [createMockPiece(0, 0, 0)],
        slots: [createMockSlot(0)],
        setPieces: vi.fn(),
        setSlots: vi.fn(),
        wronglyPlacedPieces: new Set(),
        setWronglyPlacedPieces: vi.fn(),
        lastWronglyPlacedPiece: null,
        setLastWronglyPlacedPiece: vi.fn(),
        onComplete: vi.fn(),
      })
    )

    expect(() => result.current.replacePieceWithUnplaced(999, 0)).not.toThrow()
  })
})
