import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { DeleteConfirmationDialog } from '../DeleteConfirmationDialog'

describe('DeleteConfirmationDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    itemName: 'Test Item',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render Chinese dialog copy when open is true', () => {
    render(<DeleteConfirmationDialog {...defaultProps} />)

    expect(screen.getByText('确定要删除吗？')).toBeInTheDocument()
    expect(screen.getByText('此操作将永久删除“Test Item”。此操作无法撤销。')).toBeInTheDocument()
    expect(screen.getByText('取消')).toBeInTheDocument()
    expect(screen.getByText('删除')).toBeInTheDocument()
  })

  it('should not render dialog when open is false', () => {
    render(<DeleteConfirmationDialog {...defaultProps} open={false} />)

    expect(screen.queryByText('确定要删除吗？')).not.toBeInTheDocument()
  })

  it('should call onConfirm when delete is clicked', () => {
    const onConfirm = vi.fn()
    render(<DeleteConfirmationDialog {...defaultProps} onConfirm={onConfirm} />)

    fireEvent.click(screen.getByText('删除'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should interpolate item name into description', () => {
    render(<DeleteConfirmationDialog {...defaultProps} itemName="My Document" />)

    expect(screen.getByText('此操作将永久删除“My Document”。此操作无法撤销。')).toBeInTheDocument()
  })

  it('should update description when itemName changes', () => {
    const { rerender } = render(<DeleteConfirmationDialog {...defaultProps} itemName="File 1" />)

    expect(screen.getByText('此操作将永久删除“File 1”。此操作无法撤销。')).toBeInTheDocument()

    rerender(<DeleteConfirmationDialog {...defaultProps} itemName="Important Document" />)

    expect(
      screen.getByText('此操作将永久删除“Important Document”。此操作无法撤销。')
    ).toBeInTheDocument()
  })
})
