import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryRow from '../CategoryRow'
import type { Category } from '../../types'

const mockCategory: Category = {
  id: 1,
  name: 'Test Category',
  items_count: 3,
}

const defaultProps = {
  category: mockCategory,
  isEditing: false,
  editingValue: '',
  onEditingValueChange: vi.fn(),
  onStartEdit: vi.fn(),
  onSaveEdit: vi.fn(),
  onCancelEdit: vi.fn(),
  onDelete: vi.fn(),
  onKeyDown: vi.fn(),
  inputRef: { current: null },
  loading: false,
}

describe('CategoryRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('View mode', () => {
    it('should render category name', () => {
      render(<CategoryRow {...defaultProps} isEditing={false} />)
      expect(screen.getByText('Test Category')).toBeInTheDocument()
    })

    it('should show items count', () => {
      render(<CategoryRow {...defaultProps} isEditing={false} />)
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should call onStartEdit when name is clicked', async () => {
      const user = userEvent.setup()
      const onStartEdit = vi.fn()
      render(<CategoryRow {...defaultProps} onStartEdit={onStartEdit} />)
      await user.click(screen.getByText('Test Category'))
      expect(onStartEdit).toHaveBeenCalledTimes(1)
    })

    it('should render delete button', () => {
      render(<CategoryRow {...defaultProps} />)
      expect(screen.getByLabelText('删除')).toBeInTheDocument()
    })
  })

  describe('Edit mode', () => {
    it('should render input when editing', () => {
      render(<CategoryRow {...defaultProps} isEditing={true} editingValue="New Name" />)
      expect(screen.getByDisplayValue('New Name')).toBeInTheDocument()
    })

    it('should render save button when editing', () => {
      render(<CategoryRow {...defaultProps} isEditing={true} />)
      expect(screen.getByLabelText('保存')).toBeInTheDocument()
    })

    it('should render cancel button when editing', () => {
      render(<CategoryRow {...defaultProps} isEditing={true} />)
      expect(screen.getByLabelText('取消')).toBeInTheDocument()
    })

    it('should call onSaveEdit when save button is clicked', async () => {
      const user = userEvent.setup()
      const onSaveEdit = vi.fn()
      render(<CategoryRow {...defaultProps} isEditing={true} onSaveEdit={onSaveEdit} />)
      await user.click(screen.getByLabelText('保存'))
      expect(onSaveEdit).toHaveBeenCalledTimes(1)
    })

    it('should call onCancelEdit when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onCancelEdit = vi.fn()
      render(<CategoryRow {...defaultProps} isEditing={true} onCancelEdit={onCancelEdit} />)
      await user.click(screen.getByLabelText('取消'))
      expect(onCancelEdit).toHaveBeenCalledTimes(1)
    })
  })
})
