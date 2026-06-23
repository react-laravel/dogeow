import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { NextPieceDisplay } from '../components/NextPieceDisplay'
import { generateRandomTetromino } from '../utils'
import type { Tetromino } from '../types'

describe('NextPieceDisplay', () => {
  const expectRendered = (piece: Tetromino | null) => {
    const { container } = render(<NextPieceDisplay piece={piece} />)
    expect(container.firstChild).toBeDefined()
  }

  it('should render without crashing with a piece', () => {
    expectRendered(generateRandomTetromino())
  })

  it('should render without crashing with null piece', () => {
    expectRendered(null)
  })

  it('should render I piece', () => {
    expectRendered({
      type: 'I',
      shape: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      position: { x: 3, y: 0 },
      color: '#f97316',
    })
  })

  it('should render O piece', () => {
    expectRendered({
      type: 'O',
      shape: [
        [1, 1],
        [1, 1],
      ],
      position: { x: 4, y: 0 },
      color: '#facc15',
    })
  })

  it('should render T piece', () => {
    expectRendered({
      type: 'T',
      shape: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      position: { x: 3, y: 0 },
      color: '#a78bfa',
    })
  })
})
