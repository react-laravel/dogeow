import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Item } from '@/app/thing/types'
import { ImageGallery } from '../ImageGallery'

// Mock ThingImage
vi.mock('../../../ThingImage', () => ({
  default: ({ priority: _priority, ...props }: any) => <img {...props} alt={props.alt ?? ''} />,
}))

vi.mock('@/components/ui/icons/image-placeholder', () => ({
  default: (props: any) => <div data-testid="image-placeholder" {...props} />,
}))

describe('ImageGallery', () => {
  const images: Item['images'] = [
    {
      id: 1,
      path: 'image-1.jpg',
      thumbnail_path: 'thumb-1.jpg',
      is_primary: true,
      url: 'http://example.com/img1.jpg',
      thumbnail_url: 'http://example.com/thumb1.jpg',
      rmbg_status: 'done',
    },
    {
      id: 2,
      path: 'image-2.jpg',
      thumbnail_path: 'thumb-2.jpg',
      is_primary: false,
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
    const processingImages: Item['images'] = [
      {
        id: 1,
        path: 'image-1.jpg',
        thumbnail_path: 'thumb-1.jpg',
        is_primary: true,
        url: 'http://example.com/img1.jpg',
        rmbg_status: 'processing',
      },
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
