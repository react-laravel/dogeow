import type { Item } from '@/app/thing/types'

/** 与后端 GenerateThumbnailForItemImageJob 默认缩略图边长一致 */
export const GALLERY_THUMBNAIL_MAX_PX = 200

type GalleryImageItem = Pick<Item, 'thumbnail_url' | 'primary_image' | 'images'>

function resolvePrimaryImage(item: GalleryImageItem) {
  return (
    item.primary_image ?? item.images?.find(image => image.is_primary) ?? item.images?.[0] ?? null
  )
}

/**
 * 画廊展示用图片 URL：显示尺寸大于缩略图时返回原图，否则用缩略图以节省带宽。
 */
export function getGalleryImageUrl(item: GalleryImageItem, displaySizePx: number): string | null {
  const primary = resolvePrimaryImage(item)
  const thumbnailUrl = item.thumbnail_url ?? primary?.thumbnail_url ?? null
  const fullUrl = primary?.url ?? null
  const useFullSize = displaySizePx > GALLERY_THUMBNAIL_MAX_PX

  if (useFullSize && fullUrl) {
    return fullUrl
  }

  return thumbnailUrl ?? fullUrl
}
