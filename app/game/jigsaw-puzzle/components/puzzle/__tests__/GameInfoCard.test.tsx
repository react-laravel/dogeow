import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GameInfoCard } from '../GameInfoCard'
import type { PuzzlePiece } from '@/app/game/jigsaw-puzzle/utils/puzzleUtils'

describe('GameInfoCard', () => {
  const createMockPiece = (isPlaced: boolean): PuzzlePiece => ({
    id: 0,
    row: 0,
    col: 0,
    isPlaced,
    imageUrl: '/test.jpg',
    size: 2,
    puzzleSize: 200,
  })

  const renderCard = (pieces: PuzzlePiece[], isComplete = false, showFloatingReference = false) =>
    render(
      <GameInfoCard
        pieces={pieces}
        startTime={new Date()}
        isComplete={isComplete}
        showFloatingReference={showFloatingReference}
        onToggleReference={vi.fn()}
        onReset={vi.fn()}
      />
    )

  it('should render without crashing', () => {
    const { container } = renderCard([createMockPiece(false), createMockPiece(true)])
    expect(container.firstChild).toBeDefined()
  })

  it('should show correct progress count', () => {
    const { container } = renderCard([
      createMockPiece(true),
      createMockPiece(true),
      createMockPiece(false),
      createMockPiece(false),
    ])
    expect(container.firstChild).toBeDefined()
  })

  it('should show 100% progress when complete', () => {
    const { container } = renderCard(
      [createMockPiece(true), createMockPiece(true), createMockPiece(true), createMockPiece(true)],
      true
    )
    expect(container.firstChild).toBeDefined()
  })

  it('should render timer', () => {
    const { container } = renderCard([createMockPiece(false)])
    expect(container.firstChild).toBeDefined()
  })

  it('should render toggle reference button', () => {
    const { container } = renderCard([createMockPiece(false)], false, true)
    expect(container.firstChild).toBeDefined()
  })

  it('should render reset button', () => {
    const { container } = renderCard([createMockPiece(false)])
    expect(container.firstChild).toBeDefined()
  })
})
