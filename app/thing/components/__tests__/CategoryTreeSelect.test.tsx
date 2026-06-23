import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CategoryTreeSelect from '../CategoryTreeSelect'

const mockCategories: any[] = []
const mockCreateCategory = vi.fn()
const mockFetchCategories = vi.fn()

vi.mock('@/components/ui/combobox', () => ({
  Combobox: ({ options, onChange, onCreateOption }: any) => (
    <div data-testid="combobox">
      {options?.map((opt: any) => (
        <button key={opt.value} data-value={opt.value} onClick={() => onChange?.(opt.value)}>
          {opt.label}
        </button>
      ))}
      <button data-testid="create-option" onClick={() => onCreateOption?.('New Category')}>
        Create
      </button>
    </div>
  ),
}))

vi.mock('@/app/thing/stores/itemStore', () => ({
  useItemStore: () => ({
    categories: mockCategories,
    createCategory: mockCreateCategory,
    fetchCategories: mockFetchCategories,
  }),
}))

vi.mock('@/app/thing/contracts', () => ({
  normalizeCategories: (cats: any[]) => cats,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('CategoryTreeSelect', () => {
  beforeEach(() => {
    mockCategories.length = 0
    mockCreateCategory.mockClear()
    mockFetchCategories.mockClear()
  })

  it('renders combobox', () => {
    mockCategories.push(
      { id: 1, name: 'Electronics', parent_id: null },
      { id: 2, name: 'Clothing', parent_id: null }
    )
    render(<CategoryTreeSelect onSelect={vi.fn()} />)
    expect(screen.getByTestId('combobox')).toBeDefined()
  })

  it('calls fetchCategories when categories empty', () => {
    render(<CategoryTreeSelect onSelect={vi.fn()} />)
    expect(mockFetchCategories).toHaveBeenCalled()
  })
})
