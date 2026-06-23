import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DateRangePicker } from '../DateRangePicker'

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}))

describe('DateRangePicker', () => {
  const defaultProps = {
    label: 'Purchase Date',
    fromDate: null,
    toDate: null,
    includeNull: false,
    onFromDateChange: vi.fn(),
    onToDateChange: vi.fn(),
    onIncludeNullChange: vi.fn(),
  }

  it('renders label', () => {
    render(<DateRangePicker {...defaultProps} />)
    expect(screen.getByText('Purchase Date')).toBeDefined()
  })

  it('renders from and to date inputs', () => {
    const { container } = render(<DateRangePicker {...defaultProps} />)
    const inputs = container.querySelectorAll('input[type="date"]')
    expect(inputs).toHaveLength(2)
  })

  it('renders include null checkbox', () => {
    render(<DateRangePicker {...defaultProps} />)
    expect(screen.getByText('包含空日期的物品')).toBeDefined()
  })

  it('calls onFromDateChange when from date changes', () => {
    const onFromDateChange = vi.fn()
    const { container } = render(
      <DateRangePicker {...defaultProps} onFromDateChange={onFromDateChange} />
    )
    const inputs = container.querySelectorAll('input[type="date"]')
    fireEvent.change(inputs[0], { target: { value: '2024-01-01' } })
    expect(onFromDateChange).toHaveBeenCalled()
  })

  it('calls onIncludeNullChange when checkbox toggled', () => {
    const onIncludeNullChange = vi.fn()
    render(<DateRangePicker {...defaultProps} onIncludeNullChange={onIncludeNullChange} />)
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(onIncludeNullChange).toHaveBeenCalledWith(true)
  })
})
