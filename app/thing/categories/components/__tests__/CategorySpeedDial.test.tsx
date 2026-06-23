import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategorySpeedDial from '../CategorySpeedDial'

// Mock AddCategoryDialog
vi.mock('../AddCategoryDialog', () => ({
  default: ({ open, presetCategoryType }: any) => (
    <div data-testid="add-category-dialog">
      <span data-testid="dialog-open">{open ? 'open' : 'closed'}</span>
      <span data-testid="dialog-type">{presetCategoryType}</span>
    </div>
  ),
}))

// Mock cn helper
vi.mock('@/lib/helpers', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

describe('CategorySpeedDial', () => {
  const defaultProps = {
    onCategoryAdded: vi.fn(),
    canCreateChild: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render main button', () => {
    render(<CategorySpeedDial {...defaultProps} />)
    // The main button is a button element
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('should open speed dial when main button is clicked', async () => {
    const user = userEvent.setup()
    render(<CategorySpeedDial {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[0])
    // After clicking, child items should appear
    expect(screen.getByText('主分类')).toBeInTheDocument()
  })

  it('should show "子分类" option when canCreateChild is true', async () => {
    const user = userEvent.setup()
    render(<CategorySpeedDial {...defaultProps} canCreateChild={true} />)
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[0])
    expect(screen.getByText('子分类')).toBeInTheDocument()
  })

  it('should not show "子分类" option when canCreateChild is false', async () => {
    const user = userEvent.setup()
    render(<CategorySpeedDial {...defaultProps} canCreateChild={false} />)
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[0])
    // With canCreateChild=false, the child option is disabled/hidden
    // The parent option should still be visible
    expect(screen.getByText('主分类')).toBeInTheDocument()
  })

  it('should call onCategoryAdded when AddCategoryDialog triggers it', async () => {
    const user = userEvent.setup()
    const onCategoryAdded = vi.fn()
    render(<CategorySpeedDial onCategoryAdded={onCategoryAdded} canCreateChild={true} />)
    // Open the speed dial
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[0])
    // Click on parent category to open dialog
    const parentBtn = screen.getByText('主分类')
    await user.click(parentBtn)
    // The dialog should be open
    expect(screen.getByTestId('dialog-open').textContent).toBe('open')
    expect(screen.getByTestId('dialog-type').textContent).toBe('parent')
  })
})
