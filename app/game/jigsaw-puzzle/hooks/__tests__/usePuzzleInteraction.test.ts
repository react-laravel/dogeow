import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePuzzleInteraction } from '../usePuzzleInteraction'

// Mock puzzle utils
vi.mock('../../utils/puzzleUtils', () => ({
  isPieceCorrectlyPlaced: vi.fn(() => true),
}))

describe('usePuzzleInteraction', () => {
  const createMockPiece = (id: number) => ({
    id,
    row: 0,
    col: 0,
    isPlaced: false,
    imageUrl: '/test.jpg',
    size: 2,
    puzzleSize: 200,
  })

  const createMockSlot = (id: number, pieceId: number | null = null) => ({
    id,
    row: Math.floor(id / 2),
    col: id % 2,
    pieceId,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with all handlers', () => {
    const { result } = renderHook(() =>
      usePuzzleInteraction({
        pieces: [createMockPiece(0), createMockPiece(1)],
        slots: [createMockSlot(0), createMockSlot(1)],
        draggedPiece: null,
        setDraggedPiece: vi.fn(),
        selectedPlacedPiece: null,
        setSelectedPlacedPiece: vi.fn(),
        lastWronglyPlacedPiece: null,
        setWronglyPlacedPieces: vi.fn(),
        setLastWronglyPlacedPiece: vi.fn(),
        setPieces: vi.fn(),
        setSlots: vi.fn(),
        placePieceInSlot: vi.fn(),
        swapPieces: vi.fn(),
        replacePieceWithUnplaced: vi.fn(),
        checkGameCompletion: vi.fn(),
      })
    )

    expect(typeof result.current.handleDragStart).toBe('function')
    expect(typeof result.current.handleDragEnd).toBe('function')
    expect(typeof result.current.handleDragOver).toBe('function')
    expect(typeof result.current.handleDrop).toBe('function')
    expect(typeof result.current.handlePieceClick).toBe('function')
    expect(typeof result.current.handlePlacedPieceClick).toBe('function')
    expect(typeof result.current.handleSlotClick).toBe('function')
    expect(typeof result.current.cancelSelection).toBe('function')
  })

  it('should set draggedPiece on drag start', () => {
    const setDraggedPiece = vi.fn()

    const { result } = renderHook(() =>
      usePuzzleInteraction({
        pieces: [createMockPiece(0)],
        slots: [createMockSlot(0)],
        draggedPiece: null,
        setDraggedPiece,
        selectedPlacedPiece: null,
        setSelectedPlacedPiece: vi.fn(),
        lastWronglyPlacedPiece: null,
        setWronglyPlacedPieces: vi.fn(),
        setLastWronglyPlacedPiece: vi.fn(),
        setPieces: vi.fn(),
        setSlots: vi.fn(),
        placePieceInSlot: vi.fn(),
        swapPieces: vi.fn(),
        replacePieceWithUnplaced: vi.fn(),
        checkGameCompletion: vi.fn(),
      })
    )

    const mockEvent = {
      dataTransfer: { effectAllowed: '' },
    } as unknown as React.DragEvent

    act(() => {
      result.current.handleDragStart(mockEvent, 0)
    })

    expect(setDraggedPiece).toHaveBeenCalledWith(0)
  })

  it('should clear draggedPiece on drag end', () => {
    const setDraggedPiece = vi.fn()

    const { result } = renderHook(() =>
      usePuzzleInteraction({
        pieces: [],
        slots: [],
        draggedPiece: 0,
        setDraggedPiece,
        selectedPlacedPiece: null,
        setSelectedPlacedPiece: vi.fn(),
        lastWronglyPlacedPiece: null,
        setWronglyPlacedPieces: vi.fn(),
        setLastWronglyPlacedPiece: vi.fn(),
        setPieces: vi.fn(),
        setSlots: vi.fn(),
        placePieceInSlot: vi.fn(),
        swapPieces: vi.fn(),
        replacePieceWithUnplaced: vi.fn(),
        checkGameCompletion: vi.fn(),
      })
    )

    act(() => {
      result.current.handleDragEnd()
    })

    expect(setDraggedPiece).toHaveBeenCalledWith(null)
  })

  it('should clear selection on cancel', () => {
    const setDraggedPiece = vi.fn()
    const setSelectedPlacedPiece = vi.fn()

    const { result } = renderHook(() =>
      usePuzzleInteraction({
        pieces: [],
        slots: [],
        draggedPiece: 0,
        setDraggedPiece,
        selectedPlacedPiece: 1,
        setSelectedPlacedPiece,
        lastWronglyPlacedPiece: null,
        setWronglyPlacedPieces: vi.fn(),
        setLastWronglyPlacedPiece: vi.fn(),
        setPieces: vi.fn(),
        setSlots: vi.fn(),
        placePieceInSlot: vi.fn(),
        swapPieces: vi.fn(),
        replacePieceWithUnplaced: vi.fn(),
        checkGameCompletion: vi.fn(),
      })
    )

    act(() => {
      result.current.cancelSelection()
    })

    expect(setDraggedPiece).toHaveBeenCalledWith(null)
    expect(setSelectedPlacedPiece).toHaveBeenCalledWith(null)
  })
})
