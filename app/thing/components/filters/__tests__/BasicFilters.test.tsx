import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BasicFilters } from '../BasicFilters'

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="input" {...props} />,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange?.('all')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: () => null,
}))

describe('BasicFilters', () => {
  const defaultProps = {
    name: '',
    description: '',
    status: 'all',
    isPublic: null,
    onNameChange: vi.fn(),
    onDescriptionChange: vi.fn(),
    onStatusChange: vi.fn(),
    onIsPublicChange: vi.fn(),
  }

  it('renders name input', () => {
    render(<BasicFilters {...defaultProps} />)
    expect(screen.getByText('名称')).toBeDefined()
  })

  it('renders description input', () => {
    render(<BasicFilters {...defaultProps} />)
    expect(screen.getByText('描述')).toBeDefined()
  })

  it('renders status select', () => {
    render(<BasicFilters {...defaultProps} />)
    expect(screen.getByText('状态')).toBeDefined()
  })

  it('renders public status select', () => {
    render(<BasicFilters {...defaultProps} />)
    expect(screen.getByText('公开状态')).toBeDefined()
  })

  it('calls onNameChange when name input changes', () => {
    const onNameChange = vi.fn()
    render(<BasicFilters {...defaultProps} onNameChange={onNameChange} />)
    const inputs = screen.getAllByTestId('input')
    fireEvent.change(inputs[0], { target: { value: 'test' } })
    expect(onNameChange).toHaveBeenCalledWith('test')
  })
})
