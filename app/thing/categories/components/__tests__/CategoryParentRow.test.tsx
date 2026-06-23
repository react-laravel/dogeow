import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryParentRow } from '../CategoryParentRow'
import type { Category } from '../../types'

const mockCategory: Category & { children?: Category[] } = {
  id: 1,
  name: 'Parent Category',
  parent_id: null,
  items_count: 10,
  children: [],
}

const defaultProps = {
  category: mockCategory,
  isExpanded: false,
  isEditMode: true,
  isEditing: false,
  editingValue: '',
  loading: false,
  onToggle: vi.fn(),
  onEdit: vi.fn(),
  onSave: vi.fn(),
  onCancel: vi.fn(),
  onDelete: vi.fn(),
  onCreateChild: vi.fn(),
  onValueChange: vi.fn(),
  onKeyDown: vi.fn(),
  inputRef: { current: null },
}

describe('CategoryParentRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render category name', () => {
    render(<CategoryParentRow {...defaultProps} />)
    expect(screen.getByText('Parent Category')).toBeInTheDocument()
  })

  it('should show items count in view mode', () => {
    render(<CategoryParentRow {...defaultProps} isEditMode={false} />)
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('should render delete button in edit mode', () => {
    render(<CategoryParentRow {...defaultProps} isEditMode={true} />)
    expect(screen.getByLabelText('删除')).toBeInTheDocument()
  })

  it('should render "子分类" button in edit mode when not editing', () => {
    render(<CategoryParentRow {...defaultProps} isEditMode={true} isEditing={false} />)
    expect(screen.getByText('子分类')).toBeInTheDocument()
  })

  it('should call onCreateChild when "子分类" button is clicked', async () => {
    const user = userEvent.setup()
    const onCreateChild = vi.fn()
    render(<CategoryParentRow {...defaultProps} onCreateChild={onCreateChild} />)
    await user.click(screen.getByText('子分类'))
    expect(onCreateChild).toHaveBeenCalledTimes(1)
  })

  it('should call onToggle when expand button is clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<CategoryParentRow {...defaultProps} onToggle={onToggle} />)
    // The toggle button has an aria-label
    const toggleBtn = screen.getByLabelText('展开分类')
    await user.click(toggleBtn)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
