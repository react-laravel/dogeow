import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DetailInfoForm from '../DetailInfoForm'

// Mock useForm
const mockControl = {}
const mockField = { value: '', onChange: vi.fn() }

vi.mock('react-hook-form', () => ({
  Controller: ({ render, control, name }: any) => {
    const field = { value: '', onChange: vi.fn(), name }
    return render({ field, control, name: field.name })
  },
  useForm: () => ({
    control: {},
    watch: vi.fn(),
    setValue: vi.fn(),
    formState: { errors: {} },
  }),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="input" {...props} />,
}))

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea data-testid="textarea" {...props} />,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value}>
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

describe('DetailInfoForm', () => {
  const mockFormMethods = {
    control: {},
    watch: vi.fn(),
    setValue: vi.fn(),
    formState: { errors: {} },
  }

  it('renders description textarea', () => {
    render(<DetailInfoForm formMethods={mockFormMethods as any} />)
    expect(screen.getByTestId('textarea')).toBeDefined()
  })

  it('renders status select', () => {
    render(<DetailInfoForm formMethods={mockFormMethods as any} />)
    expect(screen.getByTestId('select')).toBeDefined()
  })

  it('renders two date pickers', () => {
    render(<DetailInfoForm formMethods={mockFormMethods as any} />)
    expect(screen.getAllByTestId('date-picker').length).toBe(2)
  })

  it('renders price input', () => {
    render(<DetailInfoForm formMethods={mockFormMethods as any} />)
    const inputs = screen.getAllByTestId('input')
    const priceInput = inputs.find((input: any) => input.type === 'number')
    expect(priceInput).toBeDefined()
  })
})
