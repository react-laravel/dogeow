import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UnifiedDetailInfoForm from '../UnifiedDetailInfoForm'

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => (
    <label data-testid="label" {...props}>
      {children}
    </label>
  ),
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="input" {...props} />,
}))

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea data-testid="textarea" {...props} />,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange?.('active')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: () => null,
}))

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <input type="checkbox" checked={checked} onChange={e => onCheckedChange?.(e.target.checked)} />
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

describe('UnifiedDetailInfoForm', () => {
  it('renders description textarea in edit mode', () => {
    render(
      <UnifiedDetailInfoForm
        formData={
          {
            description: 'Test desc',
            status: 'active',
            is_public: false,
            purchase_date: null,
            expiry_date: null,
            purchase_price: null,
          } as any
        }
        setFormData={vi.fn()}
      />
    )
    expect(screen.getByTestId('textarea')).toBeDefined()
  })

  it('renders status select in edit mode', () => {
    render(
      <UnifiedDetailInfoForm
        formData={
          {
            description: '',
            status: 'active',
            is_public: false,
            purchase_date: null,
            expiry_date: null,
            purchase_price: null,
          } as any
        }
        setFormData={vi.fn()}
      />
    )
    expect(screen.getByTestId('select')).toBeDefined()
  })

  it('renders date pickers', () => {
    render(
      <UnifiedDetailInfoForm
        formData={
          {
            description: '',
            status: 'active',
            is_public: false,
            purchase_date: null,
            expiry_date: null,
            purchase_price: null,
          } as any
        }
        setFormData={vi.fn()}
      />
    )
    const datePickers = screen.getAllByTestId('date-picker')
    expect(datePickers.length).toBe(2)
  })

  it('renders price input', () => {
    render(
      <UnifiedDetailInfoForm
        formData={
          {
            description: '',
            status: 'active',
            is_public: false,
            purchase_date: null,
            expiry_date: null,
            purchase_price: 100,
          } as any
        }
        setFormData={vi.fn()}
      />
    )
    const inputs = screen.getAllByTestId('input')
    const priceInput = inputs.find((input: any) => input.type === 'number')
    expect(priceInput).toBeDefined()
  })
})
