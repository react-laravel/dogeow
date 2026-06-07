import { describe, it, expect } from 'vitest'
import { getGalleryImageUrl, GALLERY_THUMBNAIL_MAX_PX } from '../galleryImageUrl'
import type { Item } from '@/app/thing/types'

const baseItem = {
  thumbnail_url: 'https://example.com/thumb.jpg',
  primary_image: {
    id: 1,
    path: 'uploads/1/a.jpg',
    thumbnail_path: 'uploads/1/a-thumb.jpg',
    thumbnail_url: 'https://example.com/thumb.jpg',
    url: 'https://example.com/full.jpg',
  },
} as Item

describe('getGalleryImageUrl', () => {
  it('prefers full image even when display size is within thumbnail bounds', () => {
    expect(getGalleryImageUrl(baseItem, GALLERY_THUMBNAIL_MAX_PX)).toBe(
      'https://example.com/full.jpg'
    )
  })

  it('uses full image when display size exceeds thumbnail bounds', () => {
    expect(getGalleryImageUrl(baseItem, GALLERY_THUMBNAIL_MAX_PX + 1)).toBe(
      'https://example.com/full.jpg'
    )
  })

  it('falls back to full url when only full is available', () => {
    const item = {
      thumbnail_url: null,
      primary_image: {
        id: 1,
        path: 'p.jpg',
        thumbnail_path: '',
        url: 'https://example.com/full-only.jpg',
      },
    } as Item

    expect(getGalleryImageUrl(item, 100)).toBe('https://example.com/full-only.jpg')
  })

  it('returns null when no image urls exist', () => {
    expect(getGalleryImageUrl({ thumbnail_url: null } as Item, 300)).toBeNull()
  })
})
