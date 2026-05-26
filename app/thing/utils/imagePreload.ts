import type { Item } from '@/app/thing/types'

const preloadedImageUrls = new Set<string>()

function preloadImageUrl(url: string | null | undefined) {
  if (!url || typeof window === 'undefined' || preloadedImageUrls.has(url)) {
    return
  }

  preloadedImageUrls.add(url)

  const image = new window.Image()
  image.decoding = 'async'
  image.src = url
  void image.decode?.().catch(() => {
    // The browser may reject decode for cross-origin or evicted images. The
    // src assignment still warms the HTTP cache when possible.
  })
}

export function preloadThingItemImages(item: Pick<Item, 'primary_image' | 'images'> | undefined) {
  if (!item) return

  const primaryImage =
    item.primary_image ?? item.images?.find(image => image.is_primary) ?? item.images?.[0]

  preloadImageUrl(primaryImage?.url)
  preloadImageUrl(primaryImage?.thumbnail_url)
}

export function preloadThingGalleryImages(images: Item['images'] | undefined) {
  images?.forEach(image => {
    preloadImageUrl(image.url)
    preloadImageUrl(image.thumbnail_url)
  })
}
