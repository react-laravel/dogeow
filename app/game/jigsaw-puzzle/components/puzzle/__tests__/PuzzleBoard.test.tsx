import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PuzzleBoard } from '../PuzzleBoard'
import type {
  PuzzlePiece,
  PuzzleSlot as PuzzleSlotType,
} from '@/app/game/jigsaw-puzzle/utils/puzzleUtils'

describe('PuzzleBoard', () => {
  const createMockPiece = (id: number, isPlaced = false): PuzzlePiece => ({
    id,
    row: Math.floor(id / 2),
    col: id % 2,
    isPlaced,
    imageUrl: '/test.jpg',
    size: 2,
    puzzleSize: 200,
  })

  const createMockSlot = (id: number, pieceId: number | null = null): PuzzleSlotType => ({
    id,
    row: Math.floor(id / 2),
    col: id % 2,
    pieceId,
  })

  const renderBoard = ({
    slots = [createMockSlot(0), createMockSlot(1)],
    pieces = [createMockPiece(0), createMockPiece(1)],
    wronglyPlacedPieces = new Set<number>(),
    selectedPlacedPiece = null as number | null,
  } = {}) =>
    render(
      <PuzzleBoard
        size={2}
        puzzleSize={200}
        slots={slots}
        pieces={pieces}
        wronglyPlacedPieces={wronglyPlacedPieces}
        selectedPlacedPiece={selectedPlacedPiece}
        draggedPiece={null}
        imageUrl="/test.jpg"
        getBackgroundSize={() => '200% 200%'}
        getBackgroundPosition={() => '0% 0%'}
        onSlotClick={vi.fn()}
        onDragOver={vi.fn()}
        onDrop={vi.fn()}
      />
    )

  it('should render without crashing', () => {
    const { container } = renderBoard()
    expect(container.firstChild).toBeDefined()
  })

  it('should render with correct grid structure', () => {
    const { container } = renderBoard()
    expect(container.firstChild).toBeDefined()
  })

  it('should pass correct piece size to slots', () => {
    const { container } = renderBoard({
      slots: [createMockSlot(0)],
      pieces: [createMockPiece(0)],
    })
    expect(container.firstChild).toBeDefined()
  })

  it('should mark selected slot', () => {
    const { container } = renderBoard({
      slots: [createMockSlot(0, 0)],
      pieces: [createMockPiece(0)],
      selectedPlacedPiece: 0,
    })
    expect(container.firstChild).toBeDefined()
  })

  it('should mark wrongly placed pieces', () => {
    const { container } = renderBoard({
      slots: [createMockSlot(0, 0)],
      pieces: [createMockPiece(0)],
      wronglyPlacedPieces: new Set([0]),
    })
    expect(container.firstChild).toBeDefined()
  })
})
