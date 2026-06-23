import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CreatableCategorySelect from '../CreatableCategorySelect'

vi.mock('@/components/ui/command', () => ({
  Command: ({ children }: any) => <div data-testid="command">{children}</div>,
  CommandInput: ({ onValueChange, ...props }: any) => (
    <input
      data-testid="command-input"
      {...props}
      onChange={event => onValueChange?.(event.currentTarget.value)}
    />
  ),
  CommandList: ({ children }: any) => <div data-testid="command-list">{children}</div>,
  CommandItem: ({ children, onSelect, ...props }: any) => (
    <div data-testid={props['data-testid'] ?? 'command-item'} onClick={onSelect}>
      {children}
    </div>
  ),
  CommandEmpty: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

describe('CreatableCategorySelect', () => {
  const defaultProps = {
    value: '',
    onValueChange: vi.fn(),
    categories: [
      { id: 1, name: 'Electronics' },
      { id: 2, name: 'Clothing' },
    ],
  }

  it('renders with default label', () => {
    render(<CreatableCategorySelect {...defaultProps} />)
    expect(screen.getByText('选择分类')).toBeDefined()
  })

  it('shows "Uncategorized" when allowNoneOption and value is none', () => {
    render(<CreatableCategorySelect {...defaultProps} allowNoneOption value="none" />)
    expect(screen.getByText('未分类')).toBeDefined()
  })

  it('shows category name when a category is selected', () => {
    render(<CreatableCategorySelect {...defaultProps} value="1" />)
    expect(screen.getByText('Electronics')).toBeDefined()
  })

  it('opens dropdown on click', () => {
    render(<CreatableCategorySelect {...defaultProps} />)
    fireEvent.click(screen.getByText('选择分类'))
    expect(screen.getByTestId('command')).toBeDefined()
  })

  it('shows create option when no category matches input', () => {
    render(<CreatableCategorySelect {...defaultProps} />)
    fireEvent.click(screen.getByText('选择分类'))
    fireEvent.change(screen.getByTestId('command-input'), { target: { value: 'Books' } })
    expect(screen.getByTestId('create-option')).toBeDefined()
  })
})
