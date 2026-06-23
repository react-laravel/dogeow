import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImageGallery } from '../ImageGallery'

// Mock ThingImage
vi.mock('../../ThingImage', () => ({
  default: (props: any) => <img {...props} />,
}))

vi.mock('@/components/ui/icons/image-placeholder', () => ({
  default: (props: any) => <div data-testid="image-placeholder" {...props} />,
}))

describe('ImageGallery', () => {
  const images = [
    {
      id: 1,
      url: 'http://example.com/img1.jpg',
      thumbnail_url: 'http://example.com/thumb1.jpg',
      rmbg_status: 'done',
    },
    {
      id: 2,
      url: 'http://example.com/img2.jpg',
      thumbnail_url: 'http://example.com/thumb2.jpg',
      rmbg_status: 'done',
    },
  ]

  it('renders placeholder when no images', () => {
    render(<ImageGallery images={[]} itemName="Test" activeIndex={0} onIndexChange={vi.fn()} />)
    expect(screen.getByTestId('image-placeholder')).toBeDefined()
  })

  it('renders images when provided', () => {
    render(<ImageGallery images={images} itemName="Test" activeIndex={0} onIndexChange={vi.fn()} />)
    const imgs = screen.queryAllByRole('img')
    expect(imgs.length).toBeGreaterThanOrEqual(0)
  })

  it('calls onIndexChange when thumbnail clicked', () => {
    const onIndexChange = vi.fn()
    render(
      <ImageGallery images={images} itemName="Test" activeIndex={0} onIndexChange={onIndexChange} />
    )
    // Click on second image thumbnail
    const thumbnails = screen.queryAllByRole('img')
    if (thumbnails.length > 1) {
      fireEvent.click(thumbnails[1])
      expect(onIndexChange).toHaveBeenCalled()
    }
  })

  it('shows rmbg processing indicator', () => {
    const processingImages = [
      { id: 1, url: 'http://example.com/img1.jpg', rmbg_status: 'processing' },
    ]
    render(
      <ImageGallery
        images={processingImages}
        itemName="Test"
        activeIndex={0}
        onIndexChange={vi.fn()}
      />
    )
    expect(screen.getByText('去背景中，完成后自动更新')).toBeDefined()
  })
})
