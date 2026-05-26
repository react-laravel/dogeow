import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { User } from '@/app'
import { useItem } from '@/app/thing/services/api'
import { useAuth } from '@/hooks/useAuth'
import { useItemStore } from '@/app/thing/stores/itemStore'
import type { Item } from '@/app/thing/types'
import { ItemDetailModal } from '../ItemDetailModal'

// Mock dependencies
vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick }) => (
    <button onClick={onClick} data-testid="button">
      {children}
    </button>
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
  default: vi.fn(({ children, open, title, contentClassName }) =>
    open ? (
      <div data-testid="modal" data-title={title} data-content-class={contentClassName}>
        {children}
      </div>
    ) : null
  ),
}))

vi.mock('lucide-react', async importOriginal => {
  const actual = await importOriginal<typeof import('lucide-react')>()

  return {
    ...actual,
    Edit: vi.fn(() => <span data-testid="edit-icon" />),
    Trash2: vi.fn(() => <span data-testid="trash-icon" />),
    Lock: vi.fn(() => <span data-testid="lock-icon" />),
    LockOpen: vi.fn(() => <span data-testid="lock-open-icon" />),
    X: vi.fn(() => <span data-testid="x-icon" />),
  }
})

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

const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  ...overrides,
})

const createMockItem = (overrides: Partial<Item> = {}): Item => ({
  id: 1,
  name: 'Test Item',
  description: null,
  quantity: 1,
  status: 'available',
  purchase_date: null,
  expiry_date: null,
  purchase_price: null,
  category_id: 1,
  area_id: null,
  room_id: null,
  spot_id: null,
  is_public: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  user: createMockUser(),
  category: { id: 1, name: 'Test', parent_id: null },
  images: [],
  tags: [],
  ...overrides,
})

const createUseItemReturn = (
  overrides: Partial<ReturnType<typeof useItem>> = {}
): ReturnType<typeof useItem> =>
  ({
    data: undefined,
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: vi.fn(),
    ...overrides,
  }) as ReturnType<typeof useItem>

const createUseAuthReturn = (userOverrides: Partial<User> = {}): ReturnType<typeof useAuth> =>
  ({
    user: createMockUser(userOverrides),
  }) as ReturnType<typeof useAuth>

const createItemStoreReturn = (
  overrides: Partial<ReturnType<typeof useItemStore>> = {}
): ReturnType<typeof useItemStore> =>
  ({
    deleteItem: vi.fn(),
    categories: [],
    tags: [],
    fetchCategories: vi.fn(),
    fetchTags: vi.fn(),
    updateItem: vi.fn(),
    ...overrides,
  }) as ReturnType<typeof useItemStore>

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
      vi.mocked(useItem).mockReturnValueOnce(
        createUseItemReturn({
          isLoading: true,
        })
      )

      render(<ItemDetailModal {...defaultProps} />)

      const modal = screen.getByTestId('modal')
      expect(modal).toBeInTheDocument()
      expect(screen.getByText('加载中...')).toBeInTheDocument()
      expect(modal).toHaveAttribute(
        'data-content-class',
        expect.stringContaining('h-[calc(100dvh-var(--app-header-height,50px)-1rem)]')
      )
      expect(modal).toHaveAttribute('data-content-class', expect.stringContaining('p-0'))
    })

    it('should render error state when item not found', () => {
      vi.mocked(useItem).mockReturnValueOnce(
        createUseItemReturn({
          error: { message: 'Item not found' },
        })
      )

      render(<ItemDetailModal {...defaultProps} />)
      expect(screen.getByText('物品不存在')).toBeInTheDocument()
    })

    it('should render null when itemId is null', () => {
      vi.mocked(useItem).mockReturnValueOnce(createUseItemReturn())

      const { container } = render(<ItemDetailModal {...defaultProps} itemId={null} />)
      expect(container.firstChild).toBeNull()
    })

    it('should use mobile viewport constrained modal classes', () => {
      vi.mocked(useItem).mockReturnValueOnce(
        createUseItemReturn({
          data: createMockItem(),
        })
      )

      render(<ItemDetailModal {...defaultProps} />)

      const modal = screen.getByTestId('modal')
      expect(modal).toHaveAttribute(
        'data-content-class',
        expect.stringContaining('h-[calc(100dvh-var(--app-header-height,50px)-1rem)]')
      )
      expect(modal).toHaveAttribute('data-content-class', expect.stringContaining('translate-y-0'))
    })
  })

  describe('View Mode', () => {
    it('should render item details in view mode', () => {
      vi.mocked(useItem).mockReturnValueOnce(
        createUseItemReturn({
          data: createMockItem({
            description: 'Test Description',
            quantity: 5,
            purchase_price: 100,
            purchase_date: '2024-01-01',
            category: { id: 2, name: 'Electronics', parent_id: null },
            area_id: 1,
            room_id: 1,
            spot_id: 1,
            spot: {
              id: 1,
              name: 'Spot',
              room_id: 1,
              room: { id: 1, name: 'Room', area_id: 1, area: { id: 1, name: 'Home' } },
            },
          }),
        })
      )

      render(<ItemDetailModal {...defaultProps} />)

      expect(screen.getByText('Test Item')).toBeInTheDocument()
      expect(screen.getByText('Electronics')).toBeInTheDocument()
    })

    it('should show edit and delete buttons for owner', () => {
      vi.mocked(useItem).mockReturnValueOnce(
        createUseItemReturn({
          data: createMockItem({ user: createMockUser({ id: 1 }) }),
        })
      )
      vi.mocked(useAuth).mockReturnValueOnce(createUseAuthReturn({ id: 1 }))

      render(<ItemDetailModal {...defaultProps} />)

      expect(screen.getByTestId('edit-icon')).toBeInTheDocument()
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument()
    })

    it('should not show edit/delete buttons for non-owner', () => {
      vi.mocked(useItem).mockReturnValueOnce(
        createUseItemReturn({
          data: createMockItem({ user: createMockUser({ id: 2 }) }),
        })
      )
      vi.mocked(useAuth).mockReturnValueOnce(createUseAuthReturn({ id: 1 }))

      render(<ItemDetailModal {...defaultProps} />)

      expect(screen.queryByTestId('edit-icon')).not.toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    it('should switch to edit mode when edit button clicked', async () => {
      vi.mocked(useItem).mockReturnValueOnce(
        createUseItemReturn({
          data: createMockItem({ user: createMockUser({ id: 1 }) }),
        })
      )
      vi.mocked(useItemStore).mockReturnValue(
        createItemStoreReturn({
          categories: [],
          tags: [],
          fetchCategories: vi.fn(),
          fetchTags: vi.fn(),
          updateItem: vi.fn(),
        })
      )

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
      vi.mocked(useItem).mockReturnValueOnce(
        createUseItemReturn({
          data: createMockItem({ user: createMockUser({ id: 1 }) }),
        })
      )

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
      vi.mocked(useItem).mockReturnValueOnce(
        createUseItemReturn({
          data: createMockItem({ quantity: 5, user: createMockUser({ id: 1 }) }),
        })
      )

      render(<ItemDetailModal {...defaultProps} mode="edit" />)

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
      vi.mocked(useItem).mockReturnValueOnce(
        createUseItemReturn({
          data: createMockItem({ user: createMockUser({ id: 1 }) }),
        })
      )

      render(<ItemDetailModal {...defaultProps} onOpenChange={onOpenChange} />)

      const closeButton = screen.getByTestId('x-icon').closest('button')
      if (closeButton) fireEvent.click(closeButton)

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Location Display', () => {
    it('should display location info when item has location', () => {
      vi.mocked(useItem).mockReturnValueOnce(
        createUseItemReturn({
          data: createMockItem({
            user: createMockUser({ id: 1 }),
            area_id: 1,
            room_id: 1,
            spot_id: 1,
            spot: {
              id: 1,
              name: 'Desk',
              room_id: 1,
              room: {
                id: 1,
                name: 'Office',
                area_id: 1,
                area: { id: 1, name: 'Home' },
              },
            },
          }),
        })
      )

      render(<ItemDetailModal {...defaultProps} />)

      expect(screen.getByText(/Home/)).toBeInTheDocument()
      expect(screen.getByText(/Office/)).toBeInTheDocument()
      expect(screen.getByText(/Desk/)).toBeInTheDocument()
    })
  })

  describe('Tag Display', () => {
    it('should display tags when item has tags', () => {
      vi.mocked(useItem).mockReturnValueOnce(
        createUseItemReturn({
          data: createMockItem({
            user: createMockUser({ id: 1 }),
            tags: [
              { id: 1, name: 'Important' },
              { id: 2, name: 'Work' },
            ],
          }),
        })
      )

      render(<ItemDetailModal {...defaultProps} />)

      expect(screen.getByText('Important')).toBeInTheDocument()
      expect(screen.getByText('Work')).toBeInTheDocument()
    })
  })

  describe('Public/Private Toggle', () => {
    it('should show lock icon for private items', () => {
      vi.mocked(useItem).mockReturnValueOnce(
        createUseItemReturn({
          data: createMockItem({ user: createMockUser({ id: 1 }), is_public: false }),
        })
      )

      render(<ItemDetailModal {...defaultProps} mode="view" />)

      expect(screen.getByTestId('lock-icon')).toBeInTheDocument()
    })

    it('should show lock open icon for public items', () => {
      vi.mocked(useItem).mockReturnValueOnce(
        createUseItemReturn({
          data: createMockItem({ user: createMockUser({ id: 1 }), is_public: true }),
        })
      )

      render(<ItemDetailModal {...defaultProps} mode="view" />)

      expect(screen.getByTestId('lock-open-icon')).toBeInTheDocument()
    })
  })
})
