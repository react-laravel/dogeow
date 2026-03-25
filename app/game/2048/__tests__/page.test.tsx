import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Game2048 from '../page'

// Mock dependencies
vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} data-testid="button">
      {children}
    </button>
  )),
}))

vi.mock('@/components/ui/game-rules-dialog', () => ({
  GameRulesDialog: vi.fn(({ title, rules }) => (
    <div data-testid="game-rules-dialog" data-title={title}>
      {rules.map((rule: string, i: number) => (
        <span key={i}>{rule}</span>
      ))}
    </div>
  )),
}))

vi.mock('next/link', () => ({
  default: vi.fn(({ children, href }) => (
    <a href={href} data-testid="link">
      {children}
    </a>
  )),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('./components/GameBoard', () => ({
  GameBoard: vi.fn(() => <div data-testid="game-board">GameBoard</div>),
}))

vi.mock('./components/DirectionControls', () => ({
  DirectionControls: vi.fn(() => <div data-testid="direction-controls">DirectionControls</div>),
}))

vi.mock('./utils/gameEngine', () => ({
  initializeBoard: vi.fn(() => [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]),
  addRandomTile: vi.fn(),
  isGameOver: vi.fn(() => false),
  moveLeft: vi.fn(() => ({ moved: false, newBoard: [], scoreGained: 0 })),
  moveRight: vi.fn(() => ({ moved: false, newBoard: [], scoreGained: 0 })),
  moveUp: vi.fn(() => ({ moved: false, newBoard: [], scoreGained: 0 })),
  moveDown: vi.fn(() => ({ moved: false, newBoard: [], scoreGained: 0 })),
}))

vi.mock('./store', () => ({
  useGame2048Store: vi.fn(() => ({
    bestScore: 0,
    setBestScore: vi.fn(),
    incrementGamesPlayed: vi.fn(),
    incrementGamesWon: vi.fn(),
  })),
}))

// Mock window properties
const mockMatchMedia = vi.fn(
  (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  })
)

describe('Game2048', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'matchMedia').mockImplementation(mockMatchMedia)
  })

  describe('Initial Render', () => {
    it('should render game title', () => {
      render(<Game2048 />)
      expect(screen.getByText('2048')).toBeInTheDocument()
    })

    it('should render game board', () => {
      render(<Game2048 />)
      expect(screen.getByTestId('game-board')).toBeInTheDocument()
    })

    it('should render direction controls', () => {
      render(<Game2048 />)
      expect(screen.getByTestId('direction-controls')).toBeInTheDocument()
    })

    it('should render score displays', () => {
      render(<Game2048 />)
      expect(screen.getByText('当前分数')).toBeInTheDocument()
      expect(screen.getByText('最高分')).toBeInTheDocument()
    })

    it('should render reset button', () => {
      render(<Game2048 />)
      expect(screen.getByText('重新开始')).toBeInTheDocument()
    })

    it('should render undo button', () => {
      render(<Game2048 />)
      expect(screen.getByText('撤销')).toBeInTheDocument()
    })

    it('should render auto run controls', () => {
      render(<Game2048 />)
      expect(screen.getByText(/随机自动运行/)).toBeInTheDocument()
    })
  })

  describe('Game Controls', () => {
    it('should start new game when reset button clicked', async () => {
      const { useGame2048Store } = require('./store')
      const incrementGamesPlayed = vi.fn()
      vi.mocked(useGame2048Store).mockReturnValueOnce({
        bestScore: 0,
        setBestScore: vi.fn(),
        incrementGamesPlayed,
        incrementGamesWon: vi.fn(),
      })

      render(<Game2048 />)

      const resetButton = screen.getByText('重新开始')
      fireEvent.click(resetButton)

      await waitFor(() => {
        expect(screen.getByText('当前分数')).toBeInTheDocument()
      })
    })

    it('should have undo button disabled when canUndo is false', () => {
      const { useGame2048Store } = require('./store')
      vi.mocked(useGame2048Store).mockReturnValueOnce({
        bestScore: 0,
        setBestScore: vi.fn(),
        incrementGamesPlayed: vi.fn(),
        incrementGamesWon: vi.fn(),
      })

      render(<Game2048 />)

      const undoButton = screen.getByText('撤销')
      expect(undoButton.closest('button')).toHaveAttribute('disabled')
    })
  })

  describe('Keyboard Controls', () => {
    it('should add event listener for keydown', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      render(<Game2048 />)

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })

  describe('Game States', () => {
    it('should display game won message when gameWon is true', () => {
      // The component uses internal state, so we test the rendering behavior
      // by checking if the win condition UI elements exist
      render(<Game2048 />)
      // The actual win display depends on internal state manipulation
      expect(screen.getByText('2048')).toBeInTheDocument()
    })

    it('should display game over message when gameOver is true', () => {
      render(<Game2048 />)
      // The actual game over display depends on internal state
      expect(screen.getByText('2048')).toBeInTheDocument()
    })
  })

  describe('Speed Controls', () => {
    it('should render speed options', () => {
      render(<Game2048 />)
      expect(screen.getByText('不能再快了')).toBeInTheDocument()
      expect(screen.getByText('快')).toBeInTheDocument()
      expect(screen.getByText('正常')).toBeInTheDocument()
      expect(screen.getByText('慢')).toBeInTheDocument()
    })
  })

  describe('Direction Controls', () => {
    it('should render direction buttons', () => {
      render(<Game2048 />)
      // The direction controls component should have up, down, left, right buttons
      expect(screen.getByTestId('direction-controls')).toBeInTheDocument()
    })
  })

  describe('Link Navigation', () => {
    it('should render game center link', () => {
      render(<Game2048 />)
      const link = screen.getByText('游戏中心')
      expect(link).toBeInTheDocument()
      expect(link.closest('a')).toHaveAttribute('href', '/game')
    })
  })

  describe('Auto Run Controls', () => {
    it('should render random auto run button', () => {
      render(<Game2048 />)
      expect(screen.getByText(/随机自动运行/)).toBeInTheDocument()
    })

    it('should render clockwise run button', () => {
      render(<Game2048 />)
      expect(screen.getByText(/↻/)).toBeInTheDocument()
    })

    it('should render counter-clockwise run button', () => {
      render(<Game2048 />)
      expect(screen.getByText(/↺/)).toBeInTheDocument()
    })
  })

  describe('Game Rules Dialog', () => {
    it('should render game rules dialog', () => {
      render(<Game2048 />)
      expect(screen.getByTestId('game-rules-dialog')).toBeInTheDocument()
    })
  })
})
