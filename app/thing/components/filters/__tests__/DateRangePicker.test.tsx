import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateRangePicker } from '../DateRangePicker'

describe('DateRangePicker', () => {
  it('renders placeholders when dates are empty and triggers callbacks', async () => {
    const user = userEvent.setup()
    const onFromDateChange = vi.fn()
    const onToDateChange = vi.fn()
    const onIncludeNullChange = vi.fn()

    render(
      <DateRangePicker
        label="购买日期"
        fromDate={null}
        toDate={null}
        includeNull={false}
        onFromDateChange={onFromDateChange}
        onToDateChange={onToDateChange}
        onIncludeNullChange={onIncludeNullChange}
      />
    )

    expect(screen.getByText('开始日期')).toBeInTheDocument()
    expect(screen.getByText('结束日期')).toBeInTheDocument()
    expect(screen.getByText('包含空日期的物品')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('开始日期'), { target: { value: '2026-03-05' } })
    fireEvent.change(screen.getByLabelText('结束日期'), { target: { value: '2026-03-06' } })

    expect(onFromDateChange).toHaveBeenCalledTimes(1)
    expect(onToDateChange).toHaveBeenCalledTimes(1)
    expect(onFromDateChange).toHaveBeenCalledWith(new Date('2026-03-05T00:00:00'))
    expect(onToDateChange).toHaveBeenCalledWith(new Date('2026-03-06T00:00:00'))

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)
    expect(onIncludeNullChange).toHaveBeenCalledWith(true)
  })

  it('renders formatted date when dates are provided and switch is checked', () => {
    render(
      <DateRangePicker
        label="过期日期"
        fromDate={new Date(2026, 0, 2)}
        toDate={new Date(2026, 0, 31)}
        includeNull={true}
        onFromDateChange={vi.fn()}
        onToDateChange={vi.fn()}
        onIncludeNullChange={vi.fn()}
      />
    )

    expect(screen.getByLabelText('开始日期')).toHaveValue('2026-01-02')
    expect(screen.getByLabelText('结束日期')).toHaveValue('2026-01-31')
    expect(screen.getByRole('checkbox')).toBeChecked()
  })
})
