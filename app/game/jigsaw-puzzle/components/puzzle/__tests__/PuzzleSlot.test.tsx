import { render } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { PuzzleSlot } from '../PuzzleSlot'
import type {
  PuzzlePiece,
  PuzzleSlot as PuzzleSlotType,
} from '@/app/game/jigsaw-puzzle/utils/puzzleUtils'

describe('PuzzleSlot', () => {
  const createMockPiece = (id: number): PuzzlePiece => ({
    id,
    row: 0,
    col: 0,
    isPlaced: true,
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

  const renderSlot = (overrides: Partial<ComponentProps<typeof PuzzleSlot>> = {}) =>
    render(
      <PuzzleSlot
        slot={createMockSlot(0, null)}
        piece={null}
        isSelected={false}
        isWronglyPlaced={false}
        imageUrl="/test.jpg"
        pieceSize={100}
        getBackgroundSize={() => '200% 200%'}
        getBackgroundPosition={() => '0% 0%'}
        onSlotClick={vi.fn()}
        onDragOver={vi.fn()}
        onDrop={vi.fn()}
        draggedPiece={null}
        selectedPlacedPiece={null}
        {...overrides}
      />
    )

  it('should render empty slot without crashing', () => {
    const { container } = renderSlot()
    expect(container.firstChild).toBeDefined()
  })

  it('should render slot with placed piece', () => {
    const piece = createMockPiece(0)
    const { container } = renderSlot({ slot: createMockSlot(0, 0), piece })
    expect(container.firstChild).toBeDefined()
  })

  it('should render selected slot', () => {
    const piece = createMockPiece(0)
    const { container } = renderSlot({
      slot: createMockSlot(0, 0),
      piece,
      isSelected: true,
      selectedPlacedPiece: 0,
    })
    expect(container.firstChild).toBeDefined()
  })

  it('should render wrongly placed slot', () => {
    const piece = createMockPiece(0)
    const { container } = renderSlot({
      slot: createMockSlot(0, 0),
      piece,
      isWronglyPlaced: true,
    })
    expect(container.firstChild).toBeDefined()
  })

  it('should render slot with drag-over state', () => {
    const { container } = renderSlot({ draggedPiece: 0 })
    expect(container.firstChild).toBeDefined()
  })
})
