import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AutoPlayControls } from '../components/AutoPlayControls'
import { GameBoard } from '../components/GameBoard'
import { GameStatus } from '../components/GameStatus'

describe('2048 presentation components', () => {
  it('owns tile styling inside the board component', () => {
    render(
      <GameBoard
        board={[
          [2, 4, 8, 16],
          [32, 64, 128, 256],
          [512, 1024, 2048, 4096],
          [0, 0, 0, 0],
        ]}
      />
    )

    expect(screen.getByText('2048').parentElement).toHaveClass('bg-green-500')
    expect(screen.getByText('4096').parentElement).toHaveClass('bg-purple-500')
  })

  it('forwards auto-play mode and speed controls', () => {
    const onSpeedChange = vi.fn()
    const onToggleRandom = vi.fn()

    render(
      <AutoPlayControls
        speed={500}
        gameOver={false}
        randomRunning={false}
        directionalRunning={false}
        clockwise
        onSpeedChange={onSpeedChange}
        onToggleRandom={onToggleRandom}
        onToggleClockwise={vi.fn()}
        onToggleCounterClockwise={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '开始随机自动运行' }))
    fireEvent.input(screen.getByRole('slider', { name: '自动运行速度' }), {
      target: { value: '1' },
    })

    expect(onToggleRandom).toHaveBeenCalledOnce()
    expect(onSpeedChange).toHaveBeenCalledWith(200)
  })

  it('renders win and game-over messages independently', () => {
    const { rerender } = render(<GameStatus gameWon gameOver={false} score={2048} />)
    expect(screen.getByText(/恭喜/)).toBeInTheDocument()

    rerender(<GameStatus gameWon={false} gameOver score={4096} />)
    expect(screen.getByText('游戏结束')).toBeInTheDocument()
    expect(screen.getByText('最终分数: 4096')).toBeInTheDocument()
  })
})
