import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryChildRow } from '../CategoryChildRow'
import type { Category } from '../../types'

const mockCategory: Category = {
  id: 2,
  name: 'Child Category',
  parent_id: 1,
  items_count: 5,
}

const defaultProps = {
  category: mockCategory,
  isEditMode: true,
  isEditing: false,
  editingValue: '',
  loading: false,
  onEdit: vi.fn(),
  onSave: vi.fn(),
  onCancel: vi.fn(),
  onDelete: vi.fn(),
  onValueChange: vi.fn(),
  onKeyDown: vi.fn(),
  inputRef: { current: null },
}

describe('CategoryChildRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render category name', () => {
    render(<CategoryChildRow {...defaultProps} />)
    expect(screen.getByText('Child Category')).toBeInTheDocument()
  })

  it('should show items count in view mode', () => {
    render(<CategoryChildRow {...defaultProps} isEditMode={false} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should render delete button in edit mode', () => {
    render(<CategoryChildRow {...defaultProps} isEditMode={true} />)
    expect(screen.getByLabelText('删除')).toBeInTheDocument()
  })

  it('should not render delete button in view mode', () => {
    render(<CategoryChildRow {...defaultProps} isEditMode={false} />)
    expect(screen.queryByLabelText('删除')).not.toBeInTheDocument()
  })

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<CategoryChildRow {...defaultProps} onDelete={onDelete} />)
    await user.click(screen.getByLabelText('删除'))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
