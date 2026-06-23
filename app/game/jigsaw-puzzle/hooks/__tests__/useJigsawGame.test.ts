import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useJigsawGame } from '../useJigsawGame'

// Use vi.hoisted to isolate mocks and avoid polluting other test files
const {
  mockInitializePuzzlePieces,
  mockInitializePuzzleSlots,
  mockIsPieceCorrectlyPlaced,
  mockIsGameComplete,
} = vi.hoisted(() => {
  const mockInitializePuzzlePieces = vi.fn((size: number, imageUrl: string, puzzleSize: number) => {
    const totalPieces = size * size
    return Array.from({ length: totalPieces }, (_, i) => ({
      id: i,
      row: Math.floor(i / size),
      col: i % size,
      isPlaced: false,
      imageUrl,
      size,
      puzzleSize,
    }))
  })
  const mockInitializePuzzleSlots = vi.fn((size: number) => {
    const totalSlots = size * size
    return Array.from({ length: totalSlots }, (_, i) => ({
      id: i,
      row: Math.floor(i / size),
      col: i % size,
      pieceId: null,
    }))
  })
  const mockIsPieceCorrectlyPlaced = vi.fn(() => true)
  const mockIsGameComplete = vi.fn(() => false)
  return {
    mockInitializePuzzlePieces,
    mockInitializePuzzleSlots,
    mockIsPieceCorrectlyPlaced,
    mockIsGameComplete,
  }
})

vi.mock('../../utils/puzzleUtils', () => ({
  initializePuzzlePieces: mockInitializePuzzlePieces,
  initializePuzzleSlots: mockInitializePuzzleSlots,
  isPieceCorrectlyPlaced: mockIsPieceCorrectlyPlaced,
  isGameComplete: mockIsGameComplete,
  PuzzlePiece: {},
  PuzzleSlot: {},
}))

describe('useJigsawGame', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInitializePuzzlePieces.mockImplementation(
      (size: number, imageUrl: string, puzzleSize: number) => {
        const totalPieces = size * size
        return Array.from({ length: totalPieces }, (_, i) => ({
          id: i,
          row: Math.floor(i / size),
          col: i % size,
          isPlaced: false,
          imageUrl,
          size,
          puzzleSize,
        }))
      }
    )
    mockInitializePuzzleSlots.mockImplementation((size: number) => {
      const totalSlots = size * size
      return Array.from({ length: totalSlots }, (_, i) => ({
        id: i,
        row: Math.floor(i / size),
        col: i % size,
        pieceId: null,
      }))
    })
  })

  it('should initialize puzzle state', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useJigsawGame(3, '/test.jpg', 300, onComplete))

    expect(result.current.pieces.length).toBeGreaterThan(0)
    expect(result.current.slots.length).toBeGreaterThan(0)
    expect(result.current.isComplete).toBe(false)
    expect(result.current.draggedPiece).toBeNull()
    expect(result.current.selectedPlacedPiece).toBeNull()
  })

  it('should initialize with correct number of pieces for 2x2', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useJigsawGame(2, '/test.jpg', 200, onComplete))

    expect(result.current.pieces).toHaveLength(4)
    expect(result.current.slots).toHaveLength(4)
  })

  it('should initialize with correct number of pieces for 4x4', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useJigsawGame(4, '/test.jpg', 400, onComplete))

    expect(result.current.pieces).toHaveLength(16)
    expect(result.current.slots).toHaveLength(16)
  })

  it('should initialize puzzle with startTime as Date', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useJigsawGame(2, '/test.jpg', 200, onComplete))

    expect(result.current.startTime).toBeInstanceOf(Date)
  })

  it('should return all expected methods', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useJigsawGame(2, '/test.jpg', 200, onComplete))

    expect(typeof result.current.initializePuzzle).toBe('function')
    expect(typeof result.current.placePieceInSlot).toBe('function')
    expect(typeof result.current.setDraggedPiece).toBe('function')
    expect(typeof result.current.setSelectedPlacedPiece).toBe('function')
    expect(typeof result.current.setPieces).toBe('function')
    expect(typeof result.current.setSlots).toBe('function')
  })
})
