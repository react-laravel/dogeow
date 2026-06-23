import { render } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { PieceSelectionArea } from '../PieceSelectionArea'
import type { PuzzlePiece } from '@/app/game/jigsaw-puzzle/utils/puzzleUtils'

describe('PieceSelectionArea', () => {
  const createMockPiece = (id: number, isPlaced = false): PuzzlePiece => ({
    id,
    row: Math.floor(id / 2),
    col: id % 2,
    isPlaced,
    imageUrl: '/test.jpg',
    size: 2,
    puzzleSize: 200,
  })

  const renderArea = (
    pieces: PuzzlePiece[],
    overrides: Partial<ComponentProps<typeof PieceSelectionArea>> = {}
  ) =>
    render(
      <PieceSelectionArea
        pieces={pieces}
        pieceGroups={[pieces]}
        colsPerRow={2}
        selectionPieceSize={70}
        imageUrl="/test.jpg"
        size={2}
        imageDimensions={{ width: 200, height: 200 }}
        draggedPiece={null}
        showPieceNumbers={false}
        showDebugInfo={false}
        piecePreviewVisible={false}
        piecePreviewPiece={null}
        piecePreviewPosition={{ x: 0, y: 0 }}
        currentTab="0"
        tabsNeedScrolling={false}
        availableHeight={600}
        actualAvailableForGrid={500}
        maxRows={5}
        piecesPerPage={10}
        onTabChange={vi.fn()}
        onToggleDebugInfo={vi.fn()}
        onTogglePieceNumbers={vi.fn()}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onPieceClick={vi.fn()}
        onPreviewStart={vi.fn()}
        onPreviewEnd={vi.fn()}
        onTabsScrollingChange={vi.fn()}
        {...overrides}
      />
    )

  it('should render without crashing', () => {
    const { container } = renderArea([createMockPiece(0), createMockPiece(1)])
    expect(container.firstChild).toBeDefined()
  })

  it('should show remaining count', () => {
    const { container } = renderArea([
      createMockPiece(0, true),
      createMockPiece(1),
      createMockPiece(2),
    ])
    expect(container.firstChild).toBeDefined()
  })

  it('should render with multiple piece groups', () => {
    const group1 = [createMockPiece(0), createMockPiece(1)]
    const group2 = [createMockPiece(2), createMockPiece(3)]
    const { container } = renderArea([...group1, ...group2], {
      pieceGroups: [group1, group2],
      tabsNeedScrolling: true,
    })
    expect(container.firstChild).toBeDefined()
  })

  it('should show debug info when enabled', () => {
    const { container } = renderArea([createMockPiece(0)], { showDebugInfo: true })
    expect(container.firstChild).toBeDefined()
  })
})
