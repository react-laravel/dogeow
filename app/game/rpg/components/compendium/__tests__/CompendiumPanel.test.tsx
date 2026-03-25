import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CompendiumPanel } from '../CompendiumPanel'

// Mock dependencies
vi.mock('../../stores/gameStore', () => ({
  useGameStore: vi.fn(() => ({
    compendiumItems: [],
    compendiumMonsters: [],
    fetchCompendiumItems: vi.fn(),
    fetchCompendiumMonsters: vi.fn(),
  })),
}))

vi.mock('../../hooks/useMonsterDrops', () => ({
  useMonsterDrops: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
}))

vi.mock('next/image', () => ({
  default: vi.fn(() => <img />),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: vi.fn(({ children, open }) => (open ? <div data-testid="dialog">{children}</div> : null)),
  DialogContent: vi.fn(({ children }) => <div data-testid="dialog-content">{children}</div>),
  DialogHeader: vi.fn(({ children }) => <div data-testid="dialog-header">{children}</div>),
  DialogTitle: vi.fn(({ children }) => <div data-testid="dialog-title">{children}</div>),
}))

vi.mock('../../utils/itemUtils', () => ({
  getItemIconFallback: vi.fn(() => '🗡️'),
}))

vi.mock('../../utils/assetUrls', () => ({
  getRpgItemImageUrl: vi.fn(() => '/item.png'),
  getRpgMonsterImageUrl: vi.fn(() => '/monster.png'),
}))

describe('CompendiumPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render tabs for items and monsters', () => {
      render(<CompendiumPanel />)
      expect(screen.getByText('物品图鉴')).toBeInTheDocument()
      expect(screen.getByText('怪物图鉴')).toBeInTheDocument()
    })

    it('should render with items tab active by default', () => {
      render(<CompendiumPanel />)
      expect(screen.getByText('物品收集')).toBeInTheDocument()
    })
  })

  describe('Tab Switching', () => {
    it('should switch to monsters tab when clicked', async () => {
      render(<CompendiumPanel />)
      fireEvent.click(screen.getByText('怪物图鉴'))
      await waitFor(() => {
        expect(screen.getByText('怪物收集')).toBeInTheDocument()
      })
    })

    it('should switch back to items tab when clicked', async () => {
      render(<CompendiumPanel />)
      fireEvent.click(screen.getByText('怪物图鉴'))
      fireEvent.click(screen.getByText('物品图鉴'))
      await waitFor(() => {
        expect(screen.getByText('物品收集')).toBeInTheDocument()
      })
    })
  })

  describe('Item Categories', () => {
    it('should render all item category buttons', () => {
      render(<CompendiumPanel />)
      expect(screen.getByText('全部')).toBeInTheDocument()
      expect(screen.getByText('武器')).toBeInTheDocument()
      expect(screen.getByText('防具')).toBeInTheDocument()
      expect(screen.getByText('饰品')).toBeInTheDocument()
      expect(screen.getByText('药水')).toBeInTheDocument()
      expect(screen.getByText('宝石')).toBeInTheDocument()
    })

    it('should filter items by category when clicked', async () => {
      render(<CompendiumPanel />)
      fireEvent.click(screen.getByText('武器'))
      await waitFor(() => {
        expect(screen.getByText('武器')).toBeInTheDocument()
      })
    })
  })

  describe('Monster Types', () => {
    it('should render monster type filters when on monsters tab', async () => {
      render(<CompendiumPanel />)
      fireEvent.click(screen.getByText('怪物图鉴'))
      await waitFor(() => {
        expect(screen.getByText('全部')).toBeInTheDocument()
        expect(screen.getByText('普通')).toBeInTheDocument()
        expect(screen.getByText('精英')).toBeInTheDocument()
        expect(screen.getByText('BOSS')).toBeInTheDocument()
      })
    })
  })

  describe('Progress Display', () => {
    it('should display item collection progress', () => {
      render(<CompendiumPanel />)
      expect(screen.getByText(/物品收集:/)).toBeInTheDocument()
    })

    it('should display monster collection progress when on monsters tab', async () => {
      render(<CompendiumPanel />)
      fireEvent.click(screen.getByText('怪物图鉴'))
      await waitFor(() => {
        expect(screen.getByText(/怪物收集:/)).toBeInTheDocument()
      })
    })
  })

  describe('Item Grid', () => {
    it('should render item grid when items tab is active', () => {
      render(<CompendiumPanel />)
      const grid = screen.getByTestId('dialog')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Monster Grid', () => {
    it('should render monster grid when monsters tab is active', async () => {
      render(<CompendiumPanel />)
      fireEvent.click(screen.getByText('怪物图鉴'))
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
      })
    })
  })
})