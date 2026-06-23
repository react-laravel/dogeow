import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EnhancedSearchInput from '../EnhancedSearchInput'

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="search-input" {...props} />,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children, open }: any) => (
    <div data-testid="popover" data-open={open}>
      {children}
    </div>
  ),
  PopoverContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}))

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('EnhancedSearchInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSearch: vi.fn(),
  }

  it('renders search input', () => {
    render(<EnhancedSearchInput {...defaultProps} />)
    expect(screen.getByTestId('search-input')).toBeDefined()
  })

  it('calls onChange when input value changes', () => {
    const onChange = vi.fn()
    render(<EnhancedSearchInput {...defaultProps} onChange={onChange} />)
    const input = screen.getByTestId('search-input')
    fireEvent.change(input, { target: { value: 'test' } })
    expect(onChange).toHaveBeenCalledWith('test')
  })

  it('calls onSearch on form submit', () => {
    const onSearch = vi.fn()
    render(<EnhancedSearchInput {...defaultProps} value="test" onSearch={onSearch} />)
    const form = screen.getByTestId('search-input').closest('form')
    if (form) {
      fireEvent.submit(form)
      expect(onSearch).toHaveBeenCalledWith('test')
    }
  })

  it('does not call onSearch when value is empty', () => {
    const onSearch = vi.fn()
    render(<EnhancedSearchInput {...defaultProps} value="" onSearch={onSearch} />)
    const form = screen.getByTestId('search-input').closest('form')
    if (form) {
      fireEvent.submit(form)
      expect(onSearch).not.toHaveBeenCalled()
    }
  })

  it('disables submit button when no value', () => {
    render(<EnhancedSearchInput {...defaultProps} value="" />)
    // Submit button is the last button in the form
    const buttons = screen.getAllByRole('button')
    const submitBtn = buttons[buttons.length - 1]
    expect(submitBtn.hasAttribute('disabled')).toBe(true)
  })
})
