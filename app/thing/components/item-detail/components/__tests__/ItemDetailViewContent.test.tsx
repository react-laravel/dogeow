import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ItemDetailViewContent } from '../ItemDetailViewContent'

vi.mock('./ImageGallery', () => ({
  ImageGallery: ({ images, itemName, activeIndex, onIndexChange }: any) => (
    <div data-testid="image-gallery">
      Images: {images?.length ?? 0}, Name: {itemName}
    </div>
  ),
}))

vi.mock('./TagsDisplay', () => ({
  TagsDisplay: ({ tags }: any) => <div data-testid="tags-display">Tags: {tags?.length ?? 0}</div>,
}))

vi.mock('./InfoCard', () => ({
  InfoCard: ({ label, value }: any) => (
    <div data-testid="info-card">
      {label}: {String(value)}
    </div>
  ),
}))

vi.mock('./TimeInfo', () => ({
  TimeInfo: ({ item }: any) => <div data-testid="time-info">TimeInfo</div>,
}))

vi.mock('./LocationInfo', () => ({
  LocationInfo: ({ item }: any) => <div data-testid="location-info">LocationInfo</div>,
}))

describe('ItemDetailViewContent', () => {
  const defaultProps = {
    activeImageIndex: 0,
    hasDescription: true,
    item: {
      id: 1,
      name: 'Test Item',
      images: [{ id: 1, url: 'http://example.com/img.jpg' }],
      tags: [{ id: 1, name: 'Tag1', color: '#ff0000' }],
      description: 'A test item',
      quantity: 5,
      purchase_price: 100,
      purchase_date: '2024-01-01',
    } as any,
    onImageIndexChange: vi.fn(),
    trimmedDescription: 'A test item',
  }

  it('renders image gallery when images exist', () => {
    render(<ItemDetailViewContent {...defaultProps} />)
    expect(screen.getByRole('img', { name: 'Test Item' })).toBeDefined()
  })

  it('does not render image gallery when no images', () => {
    const propsNoImages = { ...defaultProps, item: { ...defaultProps.item, images: [] } }
    render(<ItemDetailViewContent {...propsNoImages} />)
    expect(screen.queryByTestId('image-gallery')).toBeNull()
  })

  it('renders tags when present', () => {
    render(<ItemDetailViewContent {...defaultProps} />)
    expect(screen.getByText('标签')).toBeDefined()
    expect(screen.getByText('Tag1')).toBeDefined()
  })

  it('renders description when hasDescription is true', () => {
    render(<ItemDetailViewContent {...defaultProps} />)
    expect(screen.getByText('A test item')).toBeDefined()
  })

  it('does not render description when hasDescription is false', () => {
    const propsNoDesc = { ...defaultProps, hasDescription: false, trimmedDescription: undefined }
    render(<ItemDetailViewContent {...propsNoDesc} />)
    expect(screen.queryByText('A test item')).toBeNull()
  })

  it('renders quantity, price and date info cards', () => {
    render(<ItemDetailViewContent {...defaultProps} />)
    expect(screen.getByText('数量')).toBeDefined()
    expect(screen.getByText('5')).toBeDefined()
    expect(screen.getByText('价格')).toBeDefined()
    expect(screen.getByText('¥100')).toBeDefined()
    expect(screen.getByText('购买日期')).toBeDefined()
    expect(screen.getByText('2024-01-01')).toBeDefined()
  })

  it('renders time and location info', () => {
    render(<ItemDetailViewContent {...defaultProps} />)
    expect(screen.getByText('时间信息')).toBeDefined()
    expect(screen.getByText('存放位置')).toBeDefined()
  })
})
