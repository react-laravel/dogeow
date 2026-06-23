import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchInput from '../SearchInput'

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
    <div data-testid="popover" data-open={String(open)}>
      {children}
    </div>
  ),
  PopoverContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
}))

describe('SearchInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSearch: vi.fn(),
  }

  it('renders search input', () => {
    render(<SearchInput {...defaultProps} />)
    expect(screen.getByTestId('search-input')).toBeDefined()
  })

  it('calls onChange when input changes', () => {
    const onChange = vi.fn()
    render(<SearchInput {...defaultProps} onChange={onChange} />)
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'test' } })
    expect(onChange).toHaveBeenCalledWith('test')
  })

  it('calls onSearch on form submit', () => {
    const onSearch = vi.fn()
    render(<SearchInput {...defaultProps} value="test" onSearch={onSearch} />)
    const form = screen.getByTestId('search-input').closest('form')
    if (form) fireEvent.submit(form)
    expect(onSearch).toHaveBeenCalledWith('test')
  })

  it('clears value when clear is clicked', () => {
    const onChange = vi.fn()
    render(<SearchInput {...defaultProps} value="test" onChange={onChange} />)
    const clearBtn = screen.getByLabelText('清除搜索')
    fireEvent.click(clearBtn)
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('has placeholder text', () => {
    render(<SearchInput {...defaultProps} />)
    expect(screen.getByPlaceholderText('搜索物品...')).toBeDefined()
  })
})
