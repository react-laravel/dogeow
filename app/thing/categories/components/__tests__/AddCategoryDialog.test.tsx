import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddCategoryDialog from '../AddCategoryDialog'

// Mock useItemStore
const mockCreateCategory = vi.fn()
const mockCategories: any[] = []

vi.mock('@/app/thing/stores/itemStore', () => ({
  useItemStore: () => ({
    categories: mockCategories,
    createCategory: mockCreateCategory,
  }),
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Mock Dialog components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, onKeyDown }: any) => (
    <div data-testid="dialog-content" onKeyDown={onKeyDown}>
      {children}
    </div>
  ),
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
}))

// Mock Select components
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange?.('parent')}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <span data-testid="select-value">{placeholder}</span>,
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>
      {children}
    </div>
  ),
}))

describe('AddCategoryDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCategories.length = 0
  })

  it('should not render when open is false', () => {
    render(<AddCategoryDialog open={false} onOpenChange={vi.fn()} onCategoryAdded={vi.fn()} />)
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
  })

  it('should render when open is true', () => {
    render(<AddCategoryDialog open={true} onOpenChange={vi.fn()} onCategoryAdded={vi.fn()} />)
    expect(screen.getByTestId('dialog')).toBeInTheDocument()
  })

  it('should show parent category title by default', () => {
    render(<AddCategoryDialog open={true} onOpenChange={vi.fn()} onCategoryAdded={vi.fn()} />)
    expect(screen.getByTestId('dialog-title').textContent).toContain('主分类')
  })

  it('should show child category title when presetCategoryType is child', () => {
    render(
      <AddCategoryDialog
        open={true}
        onOpenChange={vi.fn()}
        onCategoryAdded={vi.fn()}
        presetCategoryType="child"
      />
    )
    expect(screen.getByTestId('dialog-title').textContent).toContain('子分类')
  })

  it('should render input field', () => {
    render(<AddCategoryDialog open={true} onOpenChange={vi.fn()} onCategoryAdded={vi.fn()} />)
    expect(screen.getByPlaceholderText('输入主分类名称')).toBeInTheDocument()
  })

  it('should render submit button', () => {
    render(<AddCategoryDialog open={true} onOpenChange={vi.fn()} onCategoryAdded={vi.fn()} />)
    expect(screen.getByText('创建主分类')).toBeInTheDocument()
  })

  it('should render cancel button', () => {
    render(<AddCategoryDialog open={true} onOpenChange={vi.fn()} onCategoryAdded={vi.fn()} />)
    expect(screen.getByText('取消')).toBeInTheDocument()
  })
})
