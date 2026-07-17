import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ItemDetailModalHeader } from '../ItemDetailModalHeader'

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="name-input" {...props} />,
}))

vi.mock('../../../CategoryTreeSelect', () => ({
  default: ({ onSelect, selectedCategory }: any) => (
    <div data-testid="category-tree-select">
      <button onClick={() => onSelect('parent', 1)}>Select Category</button>
    </div>
  ),
}))

vi.mock('../../AutoSaveStatus', () => ({
  default: ({ autoSaving, lastSaved }: any) => (
    <div data-testid="auto-save-status">{autoSaving ? 'Saving' : 'Saved'}</div>
  ),
}))

vi.mock('../StatusIndicator', () => ({
  StatusIndicator: ({ status }: any) => <span data-testid="status-indicator">{status}</span>,
}))

describe('ItemDetailModalHeader', () => {
  const defaultProps = {
    autoSaving: false,
    canEdit: true,
    displayCategoryName: 'Electronics',
    displayName: 'Test Item',
    formData: { name: 'Test Item', quantity: 1, is_public: false } as any,
    isInlineEditMode: false,
    isPublicItem: false,
    itemStatus: 'active',
    lastSaved: null,
    onCategorySelect: vi.fn(),
    onClose: vi.fn(),
    onDelete: vi.fn(),
    onEdit: vi.fn(),
    onQuantityClick: vi.fn(),
    selectedCategory: undefined,
    setFormData: vi.fn(),
  }

  it('renders item name in view mode', () => {
    render(<ItemDetailModalHeader {...defaultProps} />)
    expect(screen.getByText('Test Item')).toBeDefined()
  })

  it('renders category badge in view mode', () => {
    render(<ItemDetailModalHeader {...defaultProps} />)
    expect(screen.getByText('Electronics')).toBeDefined()
  })

  it('renders edit and delete buttons when canEdit is true', () => {
    render(<ItemDetailModalHeader {...defaultProps} />)
    expect(screen.getByLabelText('编辑物品')).toHaveTextContent('编辑')
    expect(screen.getByLabelText('删除物品')).toHaveTextContent('删除')
  })

  it('hides edit/delete when canEdit is false', () => {
    render(<ItemDetailModalHeader {...defaultProps} canEdit={false} />)
    expect(screen.queryByLabelText('编辑物品')).toBeNull()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<ItemDetailModalHeader {...defaultProps} onClose={onClose} />)
    const closeBtn = screen.getByLabelText('关闭')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('renders category select in edit mode', () => {
    render(<ItemDetailModalHeader {...defaultProps} isInlineEditMode />)
    expect(screen.getByTestId('category-tree-select')).toBeDefined()
  })
})
