import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SnakeGame from '../page'

// Mock dependencies
vi.mock('./store', () => ({
  useSnakeGameStore: vi.fn(() => ({
    bestScore: 0,
    setBestScore: vi.fn(),
    incrementGamesPlayed: vi.fn(),
    addFoodEaten: vi.fn(),
  })),
}))

vi.mock('@/components/ui/card', () => ({
  Card: vi.fn(({ children }) => <div data-testid="card">{children}</div>),
}))

vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick }) => (
    <button onClick={onClick} data-testid="button">{children}</button>
  )),
}))

vi.mock('@/components/ui/game-rules-dialog', () => ({
  GameRulesDialog: vi.fn(({ children }) => <div data-testid="game-rules">{children}</div>),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('next/link', () => ({
  default: vi.fn(({ children }) => <a href="#">{children}</a>),
}))

describe('SnakeGame', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the snake game page', () => {
      render(<SnakeGame />)
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })

    it('should render game title', () => {
      render(<SnakeGame />)
      expect(screen.getByText('贪吃蛇')).toBeInTheDocument()
    })

    it('should render start button', () => {
      render(<SnakeGame />)
      expect(screen.getByText('开始游戏')).toBeInTheDocument()
    })

    it('should render rules button', () => {
      render(<SnakeGame />)
      expect(screen.getByText('游戏规则')).toBeInTheDocument()
    })
  })

  describe('Game State', () => {
    it('should show score of 0 initially', () => {
      render(<SnakeGame />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should render game over message initially hidden', () => {
      render(<SnakeGame />)
      expect(screen.queryByText('游戏结束')).not.toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should start game when start button is clicked', async () => {
      render(<SnakeGame />)
      const startButton = screen.getByText('开始游戏')
      fireEvent.click(startButton)
      await waitFor(() => {
        expect(screen.getByText('重新开始')).toBeInTheDocument()
      })
    })
  })

  describe('Game Board', () => {
    it('should render game board container', () => {
      render(<SnakeGame />)
      const board = document.querySelector('.grid')
      expect(board).toBeInTheDocument()
    })
  })

  describe('Score Display', () => {
    it('should display current score', () => {
      render(<SnakeGame />)
      expect(screen.getByText(/得分/)).toBeInTheDocument()
    })

    it('should display best score', () => {
      render(<SnakeGame />)
      expect(screen.getByText(/最高分/)).toBeInTheDocument()
    })
  })
})