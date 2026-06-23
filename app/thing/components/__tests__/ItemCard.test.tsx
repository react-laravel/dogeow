import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ItemCard from '../ItemCard'

const mockItem = {
  id: 1,
  name: 'Test Item',
  description: 'A test description',
  category: { name: 'Electronics' },
  tags: [{ id: 1, name: 'tag1', color: '#ff0000' }],
  status: 'active',
  primary_image: null,
  images: [],
  spot: null,
}

describe('ItemCard', () => {
  it('renders item name', () => {
    render(<ItemCard item={mockItem} onEdit={vi.fn()} onView={vi.fn()} />)
    expect(screen.getByText('Test Item')).toBeDefined()
  })

  it('renders item description', () => {
    render(<ItemCard item={mockItem} onEdit={vi.fn()} onView={vi.fn()} />)
    expect(screen.getByText('A test description')).toBeDefined()
  })

  it('renders category badge', () => {
    render(<ItemCard item={mockItem} onEdit={vi.fn()} onView={vi.fn()} />)
    expect(screen.getByText('Electronics')).toBeDefined()
  })

  it('calls onView when clicked', () => {
    const onView = vi.fn()
    render(<ItemCard item={mockItem} onEdit={vi.fn()} onView={onView} />)
    fireEvent.click(screen.getByText('Test Item').closest('div')!.parentElement!)
    expect(onView).toHaveBeenCalled()
  })

  it('renders loading skeleton when isLoading is true', () => {
    render(<ItemCard item={{} as any} onEdit={vi.fn()} onView={vi.fn()} isLoading />)
    expect(screen.queryByText('Test Item')).toBeNull()
  })

  it('shows Uncategorized when no category', () => {
    const itemNoCat = { ...mockItem, category: null }
    render(<ItemCard item={itemNoCat} onEdit={vi.fn()} onView={vi.fn()} />)
    expect(screen.getByText('未分类')).toBeDefined()
  })
})
