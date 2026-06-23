import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GalleryItem } from '../GalleryItem'

const mockItem = {
  id: 1,
  name: 'Test Item',
  status: 'active',
  category: { name: 'Electronics' },
  images: [],
  primary_image: null,
}

describe('GalleryItem', () => {
  it('renders item name', () => {
    render(<GalleryItem item={mockItem} imageSize={120} onClick={vi.fn()} />)
    expect(screen.getByText('Test Item')).toBeDefined()
  })

  it('renders category name', () => {
    render(<GalleryItem item={mockItem} imageSize={120} onClick={vi.fn()} />)
    expect(screen.getByText('Electronics')).toBeDefined()
  })

  it('renders Uncategorized when no category', () => {
    const itemNoCat = { ...mockItem, category: null }
    render(<GalleryItem item={itemNoCat} imageSize={120} onClick={vi.fn()} />)
    expect(screen.getByText('Uncategorized')).toBeDefined()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<GalleryItem item={mockItem} imageSize={120} onClick={onClick} />)
    fireEvent.click(screen.getByText('Test Item').closest('div')!.parentElement!)
    expect(onClick).toHaveBeenCalledWith(mockItem)
  })

  it('applies red border for expired items', () => {
    const expiredItem = { ...mockItem, status: 'expired' }
    render(<GalleryItem item={expiredItem} imageSize={120} onClick={vi.fn()} />)
    const container = screen.getByText('Test Item').closest('div')!.parentElement!
    expect(container.className).toContain('border-red-500')
  })

  it('applies orange border for damaged items', () => {
    const damagedItem = { ...mockItem, status: 'damaged' }
    render(<GalleryItem item={damagedItem} imageSize={120} onClick={vi.fn()} />)
    const container = screen.getByText('Test Item').closest('div')!.parentElement!
    expect(container.className).toContain('border-orange-500')
  })

  it('applies amber border for idle items', () => {
    const idleItem = { ...mockItem, status: 'idle' }
    render(<GalleryItem item={idleItem} imageSize={120} onClick={vi.fn()} />)
    const container = screen.getByText('Test Item').closest('div')!.parentElement!
    expect(container.className).toContain('border-amber-500')
  })

  it('uses specified image size', () => {
    render(<GalleryItem item={mockItem} imageSize={200} onClick={vi.fn()} />)
    const container = screen.getByText('Test Item').closest('div')!.parentElement!
    expect(container.style.width).toBe('200px')
    expect(container.style.height).toBe('200px')
  })
})
