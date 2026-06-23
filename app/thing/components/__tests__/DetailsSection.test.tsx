import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DetailsSection from '../DetailsSection'

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="input" {...props} />,
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => (
    <label data-testid="label" {...props}>
      {children}
    </label>
  ),
}))

vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({ date, setDate, placeholder }: any) => (
    <input
      data-testid="date-picker"
      value={date ? '2024-01-01' : ''}
      onChange={e => setDate?.(e.target.value ? new Date(e.target.value) : null)}
      placeholder={placeholder}
    />
  ),
}))

vi.mock('../LocationTreeSelect', () => ({
  default: ({ onSelect }: any) => (
    <div data-testid="location-tree-select">
      <button data-testid="loc-btn" onClick={() => onSelect('area', 1, 'Room A')}>
        Select
      </button>
    </div>
  ),
}))

const defaultProps = {
  formData: { purchase_date: null, expiry_date: null, purchase_price: null },
  setFormData: vi.fn(),
  locationPath: '',
  selectedLocation: undefined,
  onLocationSelect: vi.fn(),
}

describe('DetailsSection', () => {
  it('renders card', () => {
    render(<DetailsSection {...defaultProps} />)
    expect(screen.getByTestId('card')).toBeDefined()
  })

  it('renders two date pickers', () => {
    render(<DetailsSection {...defaultProps} />)
    expect(screen.getAllByTestId('date-picker').length).toBe(2)
  })

  it('renders location tree select', () => {
    render(<DetailsSection {...defaultProps} />)
    expect(screen.getByTestId('location-tree-select')).toBeDefined()
  })

  it('calls onLocationSelect when location selected', () => {
    const onLocationSelect = vi.fn()
    render(<DetailsSection {...defaultProps} onLocationSelect={onLocationSelect} />)
    fireEvent.click(screen.getByTestId('loc-btn'))
    expect(onLocationSelect).toHaveBeenCalledWith('area', 1, 'Room A')
  })

  it('shows location path when provided', () => {
    render(<DetailsSection {...defaultProps} locationPath="Area > Room" />)
    expect(screen.getByText('当前位置: Area > Room')).toBeDefined()
  })

  it('hides location path when empty', () => {
    render(<DetailsSection {...defaultProps} />)
    expect(screen.queryByText(/当前位置/)).toBeNull()
  })
})
