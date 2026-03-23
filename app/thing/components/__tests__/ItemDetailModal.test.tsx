import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ItemDetailModal } from '../ItemDetailModal'

// Mock dependencies
vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick }) => (
    <button onClick={onClick} data-testid="button">{children}</button>
  )),
}))

vi.mock('@/components/ui/card', () => ({
  Card: vi.fn(({ children }) => <div data-testid="card">{children}</div>),
  CardContent: vi.fn(({ children }) => <div data-testid="card-content">{children}</div>),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: vi.fn(({ children }) => <span data-testid="badge">{children}</span>),
}))

vi.mock('@/components/ui/input', () => ({
  Input: vi.fn(({ value, onChange }) => (
    <input type="text" value={value} onChange={onChange} data-testid="input" />
  )),
}))

vi.mock('@/components/ui/modal', () => ({
  default: vi.fn(({ children, open, title }) =>
    open ? <div data-testid="modal" data-title={title}>{children}</div> : null
  ),
}))

vi.mock('lucide-react', () => ({
  Edit: vi.fn(() => <span data-testid="edit-icon" />),
  Trash2: vi.fn(() => <span data-testid="trash-icon" />),
  Lock: vi.fn(() => <span data-testid="lock-icon" />),
  LockOpen: vi.fn(() => <span data-testid="lock-open-icon" />),
  X: vi.fn(() => <span data-testid="x-icon" />),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/app/thing/stores/itemStore', () => ({
  useItemStore: vi.fn(() => ({
    deleteItem: vi.fn(),
    categories: [],
    tags: [],
    fetchCategories: vi.fn(),
    fetchTags: vi.fn(),
    updateItem: vi.fn(),
  })),
}))

vi.mock('@/app/thing/services/api', () => ({
  useItem: vi.fn(() => ({ data: null, error: null, isLoading: false })),
  useAreas: vi.fn(() => ({ mutate: vi.fn() })),
  useRooms: vi.fn(() => ({ data: [] })),
  useSpots: vi.fn(() => ({ data: [] })),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { id: 1 } })),
}))

vi.mock('@/hooks/useAutoSave', () => ({
  useAutoSave: vi.fn(() => ({
    autoSaving: false,
    lastSaved: null,
    triggerAutoSave: vi.fn(),
    setInitialData: vi.fn(),
    cancelAutoSave: vi.fn(),
  })),
}))

vi.mock('@/app/thing/utils/dataTransform', () => ({
  convertImagesToUploadedFormat: vi.fn(() => []),
  buildLocationPath: vi.fn(() => ''),
  tagsToIdStrings: vi.fn(() => []),
  hasDataChanged: vi.fn(() => false),
}))

vi.mock('@/app/thing/constants', () => ({
  INITIAL_FORM_DATA: {
    name: '',
    description: '',
    quantity: 1,
    status: 'available',
    purchase_date: null,
    expiry_date: null,
    purchase_price: null,
    category_id: '',
    area_id: '',
    room_id: '',
    spot_id: '',
    is_public: false,
  },
  AUTO_SAVE_DELAY: 2000,
}))

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}))

describe('ItemDetailModal', () => {
  const defaultProps = {
    itemId: 1,
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render loading state when loading', () => {
      const { useItem } = require('@/app/thing/services/api')
      vi.mocked(useItem).mockReturnValueOnce({
        data: null,
        error: null,
        isLoading: true,
      })

      render(<ItemDetailModal {...defaultProps} />)
      expect(screen.getByTestId('modal')).toBeInTheDocument()
    })

    it('should render error state when item not found', () => {
      const { useItem } = require('@/app/thing/services/api')
      vi.mocked(useItem).mockReturnValueOnce({
        data: null,
        error: { message: 'Item not found' },
        isLoading: false,
      })

      render(<ItemDetailModal {...defaultProps} />)
      expect(screen.getByText('物品不存在')).toBeInTheDocument()
    })

    it('should render null when itemId is null', () => {
      const { useItem } = require('@/app/thing/services/api')
      vi.mocked(useItem).mockReturnValueOnce({
        data: null,
        error: null,
        isLoading: false,
      })

      const { container } = render(<ItemDetailModal {...defaultProps} itemId={null} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('View Mode', () => {
    it('should render item details in view mode', () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        description: 'Test Description',
        quantity: 5,
        status: 'available',
        category: { name: 'Electronics' },
        images: [],
        tags: [],
        is_public: true,
        purchase_price: 100,
        purchase_date: '2024-01-01',
        spot: { room: { area: { name: 'Home' }, name: 'Room' }, name: 'Spot' },
      }

      const { useItem } = require('@/app/thing/services/api')
      vi.mocked(useItem).mockReturnValueOnce({
        data: mockItem,
        error: null,
        isLoading: false,
      })

      render(<ItemDetailModal {...defaultProps} />)

      expect(screen.getByText('Test Item')).toBeInTheDocument()
      expect(screen.getByText('Electronics')).toBeInTheDocument()
    })

    it('should show edit and delete buttons for owner', () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        user: { id: 1 },
        category: { name: 'Test' },
        images: [],
        tags: [],
        is_public: true,
      }

      const { useItem } = require('@/app/thing/services/api')
      const { useAuth } = require('@/hooks/useAuth')
      vi.mocked(useItem).mockReturnValueOnce({
        data: mockItem,
        error: null,
        isLoading: false,
      })
      vi.mocked(useAuth).mockReturnValueOnce({ user: { id: 1 } })

      render(<ItemDetailModal {...defaultProps} />)

      expect(screen.getByTestId('edit-icon')).toBeInTheDocument()
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument()
    })

    it('should not show edit/delete buttons for non-owner', () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        user: { id: 2 },
        category: { name: 'Test' },
        images: [],
        tags: [],
        is_public: true,
      }

      const { useItem } = require('@/app/thing/services/api')
      const { useAuth } = require('@/hooks/useAuth')
      vi.mocked(useItem).mockReturnValueOnce({
        data: mockItem,
        error: null,
        isLoading: false,
      })
      vi.mocked(useAuth).mockReturnValueOnce({ user: { id: 1 } })

      render(<ItemDetailModal {...defaultProps} />)

      expect(screen.queryByTestId('edit-icon')).not.toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    it('should switch to edit mode when edit button clicked', async () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        user: { id: 1 },
        category: { name: 'Test' },
        images: [],
        tags: [],
        is_public: true,
      }

      const { useItem } = require('@/app/thing/services/api')
      const { useItemStore } = require('@/app/thing/stores/itemStore')
      vi.mocked(useItem).mockReturnValueOnce({
        data: mockItem,
        error: null,
        isLoading: false,
      })
      vi.mocked(useItemStore).mockReturnValue({
        ...vi.mocked(useItemStore)(),
        categories: [],
        tags: [],
        fetchCategories: vi.fn(),
        fetchTags: vi.fn(),
        updateItem: vi.fn(),
      })

      render(<ItemDetailModal {...defaultProps} mode="view" />)

      const editButton = screen.getByTestId('edit-icon').closest('button')
      if (editButton) fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByTestId('input')).toBeInTheDocument()
      })
    })
  })

  describe('Delete Dialog', () => {
    it('should open delete confirmation dialog', async () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        user: { id: 1 },
        category: { name: 'Test' },
        images: [],
        tags: [],
        is_public: true,
      }

      const { useItem } = require('@/app/thing/services/api')
      vi.mocked(useItem).mockReturnValueOnce({
        data: mockItem,
        error: null,
        isLoading: false,
      })

      render(<ItemDetailModal {...defaultProps} />)

      const deleteButton = screen.getByTestId('trash-icon').closest('button')
      if (deleteButton) fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('确认删除')).toBeInTheDocument()
      })
    })
  })

  describe('Quantity Dialog', () => {
    it('should open quantity dialog when quantity button clicked', async () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        quantity: 5,
        user: { id: 1 },
        category: { name: 'Test' },
        images: [],
        tags: [],
        is_public: true,
      }

      const { useItem } = require('@/app/thing/services/api')
      vi.mocked(useItem).mockReturnValueOnce({
        data: mockItem,
        error: null,
        isLoading: false,
      })

      render(<ItemDetailModal {...defaultProps} mode="view" />)

      const quantityButton = screen.getByText('x5')?.closest('button')
      if (quantityButton) fireEvent.click(quantityButton)

      await waitFor(() => {
        expect(screen.getByText(/数量/)).toBeInTheDocument()
      })
    })
  })

  describe('Close Behavior', () => {
    it('should call onOpenChange with false when close button clicked', () => {
      const onOpenChange = vi.fn()
      const mockItem = {
        id: 1,
        name: 'Test Item',
        user: { id: 1 },
        category: { name: 'Test' },
        images: [],
        tags: [],
        is_public: true,
      }

      const { useItem } = require('@/app/thing/services/api')
      vi.mocked(useItem).mockReturnValueOnce({
        data: mockItem,
        error: null,
        isLoading: false,
      })

      render(<ItemDetailModal {...defaultProps} onOpenChange={onOpenChange} />)

      const closeButton = screen.getByTestId('x-icon').closest('button')
      if (closeButton) fireEvent.click(closeButton)

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Location Display', () => {
    it('should display location info when item has location', () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        user: { id: 1 },
        category: { name: 'Test' },
        images: [],
        tags: [],
        is_public: true,
        spot: {
          name: 'Desk',
          room: { name: 'Office', area: { name: 'Home' } },
        },
      }

      const { useItem } = require('@/app/thing/services/api')
      vi.mocked(useItem).mockReturnValueOnce({
        data: mockItem,
        error: null,
        isLoading: false,
      })

      render(<ItemDetailModal {...defaultProps} />)

      expect(screen.getByText(/Home/)).toBeInTheDocument()
      expect(screen.getByText(/Office/)).toBeInTheDocument()
      expect(screen.getByText(/Desk/)).toBeInTheDocument()
    })
  })

  describe('Tag Display', () => {
    it('should display tags when item has tags', () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        user: { id: 1 },
        category: { name: 'Test' },
        images: [],
        tags: [{ id: 1, name: 'Important' }, { id: 2, name: 'Work' }],
        is_public: true,
      }

      const { useItem } = require('@/app/thing/services/api')
      vi.mocked(useItem).mockReturnValueOnce({
        data: mockItem,
        error: null,
        isLoading: false,
      })

      render(<ItemDetailModal {...defaultProps} />)

      expect(screen.getByText('Important')).toBeInTheDocument()
      expect(screen.getByText('Work')).toBeInTheDocument()
    })
  })

  describe('Public/Private Toggle', () => {
    it('should show lock icon for private items', () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        user: { id: 1 },
        category: { name: 'Test' },
        images: [],
        tags: [],
        is_public: false,
      }

      const { useItem } = require('@/app/thing/services/api')
      vi.mocked(useItem).mockReturnValueOnce({
        data: mockItem,
        error: null,
        isLoading: false,
      })

      render(<ItemDetailModal {...defaultProps} mode="view" />)

      expect(screen.getByTestId('lock-icon')).toBeInTheDocument()
    })

    it('should show lock open icon for public items', () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        user: { id: 1 },
        category: { name: 'Test' },
        images: [],
        tags: [],
        is_public: true,
      }

      const { useItem } = require('@/app/thing/services/api')
      vi.mocked(useItem).mockReturnValueOnce({
        data: mockItem,
        error: null,
        isLoading: false,
      })

      render(<ItemDetailModal {...defaultProps} mode="view" />)

      expect(screen.getByTestId('lock-open-icon')).toBeInTheDocument()
    })
  })
})
