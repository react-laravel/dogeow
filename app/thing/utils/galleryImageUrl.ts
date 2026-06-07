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
 * 画廊展示用图片 URL：优先用原图，避免缩略图文件自带留白影响展示。
 */
export function getGalleryImageUrl(item: GalleryImageItem, _displaySizePx: number): string | null {
  const primary = resolvePrimaryImage(item)
  const thumbnailUrl = item.thumbnail_url ?? primary?.thumbnail_url ?? null
  const fullUrl = primary?.url ?? null

  if (fullUrl) {
    return fullUrl
  }

  return thumbnailUrl ?? fullUrl
}
