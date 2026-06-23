import { render } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { PuzzlePieceItem } from '../PuzzlePieceItem'
import type { PuzzlePiece } from '@/app/game/jigsaw-puzzle/utils/puzzleUtils'

describe('PuzzlePieceItem', () => {
  const createMockPiece = (overrides: Partial<PuzzlePiece> = {}): PuzzlePiece => ({
    id: overrides.id ?? 0,
    row: overrides.row ?? 0,
    col: overrides.col ?? 0,
    isPlaced: overrides.isPlaced ?? false,
    imageUrl: '/test.jpg',
    size: 2,
    puzzleSize: 200,
    ...overrides,
  })

  const renderItem = (overrides: Partial<ComponentProps<typeof PuzzlePieceItem>> = {}) =>
    render(
      <PuzzlePieceItem
        piece={createMockPiece()}
        pieceSize={100}
        imageUrl="/test.jpg"
        size={2}
        imageDimensions={{ width: 200, height: 200 }}
        isDragged={false}
        showPieceNumbers={false}
        piecePreviewVisible={false}
        piecePreviewPiece={null}
        piecePreviewPosition={{ x: 0, y: 0 }}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onClick={vi.fn()}
        onPreviewStart={vi.fn()}
        onPreviewEnd={vi.fn()}
        {...overrides}
      />
    )

  it('should render unplaced piece without crashing', () => {
    const { container } = renderItem()
    expect(container.firstChild).toBeDefined()
  })

  it('should render placed piece as empty placeholder', () => {
    const { container } = renderItem({ piece: createMockPiece({ isPlaced: true }) })
    expect(container.firstChild).toBeDefined()
  })

  it('should render with piece numbers when enabled', () => {
    const { container } = renderItem({
      piece: createMockPiece({ id: 5 }),
      showPieceNumbers: true,
    })
    expect(container.firstChild).toBeDefined()
  })

  it('should render with dragged state', () => {
    const { container } = renderItem({ isDragged: true })
    expect(container.firstChild).toBeDefined()
  })

  it('should render with piece preview', () => {
    const { container } = renderItem({
      piecePreviewVisible: true,
      piecePreviewPiece: createMockPiece({ id: 10 }),
      piecePreviewPosition: { x: 150, y: 300 },
    })
    expect(container.firstChild).toBeDefined()
  })
})
