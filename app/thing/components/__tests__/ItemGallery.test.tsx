import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ItemGallery from '../ItemGallery'

const mockItems = [
  {
    id: 1,
    name: 'Item 1',
    status: 'active',
    images: [],
    primary_image: null,
    category: { name: 'Cat1' },
  },
  {
    id: 2,
    name: 'Item 2',
    status: 'active',
    images: [],
    primary_image: null,
    category: { name: 'Cat2' },
  },
]

describe('ItemGallery', () => {
  it('shows empty message when no items', () => {
    render(<ItemGallery items={[]} />)
    expect(screen.getByText('No items to display.')).toBeDefined()
  })

  it('renders items when provided', () => {
    render(<ItemGallery items={mockItems} />)
    expect(screen.getByText('Item 1')).toBeDefined()
    expect(screen.getByText('Item 2')).toBeDefined()
  })

  it('calls onItemView when item clicked', () => {
    const onItemView = vi.fn()
    render(<ItemGallery items={mockItems} onItemView={onItemView} />)
    fireEvent.click(screen.getByText('Item 1'))
    expect(onItemView).toHaveBeenCalledWith(1)
  })

  it('renders gallery container', () => {
    const { container } = render(<ItemGallery items={mockItems} />)
    expect(container.querySelector('#item-gallery-container')).toBeDefined()
  })
})
