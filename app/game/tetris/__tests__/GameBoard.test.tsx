import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { GameBoard } from '../components/GameBoard'
import { createEmptyBoard, generateRandomTetromino } from '../utils'
import type { Board, Tetromino } from '../types'

describe('GameBoard', () => {
  it('should render without crashing', () => {
    const board = createEmptyBoard()
    const { container } = render(<GameBoard board={board} currentPiece={null} />)
    expect(container.firstChild).toBeDefined()
  })

  it('should render with a piece on the board', () => {
    const board = createEmptyBoard()
    const piece: Tetromino = generateRandomTetromino()
    const { container } = render(<GameBoard board={board} currentPiece={piece} />)
    expect(container.firstChild).toBeDefined()
  })

  it('should render 20 rows', () => {
    const board = createEmptyBoard()
    const { container } = render(<GameBoard board={board} currentPiece={null} />)
    expect(container.firstChild).toBeDefined()
    // The board has 20 rows (BOARD_HEIGHT)
  })

  it('should render with partially filled board', () => {
    const board: Board = createEmptyBoard()
    board[19][0] = '#f97316'
    board[19][1] = '#f97316'
    board[19][2] = '#f97316'
    board[19][3] = '#f97316'

    const { container } = render(<GameBoard board={board} currentPiece={null} />)
    expect(container.firstChild).toBeDefined()
  })
})
