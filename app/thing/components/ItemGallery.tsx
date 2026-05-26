'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Item } from '@/app/thing/types'
import type { SizePreset } from './ImageSizeControl'
import { GalleryItem } from './GalleryItem'
import { useTranslation } from '@/hooks/useTranslation'
import { ensureEven } from '@/lib/helpers/mathUtils'

interface ItemGalleryProps {
  items: Item[]
  imageSizePreset?: SizePreset
  onItemView?: (id: number) => void
}

export default function ItemGallery({ items, imageSizePreset, onItemView }: ItemGalleryProps) {
  const { t } = useTranslation()
  const [imageSize, setImageSize] = useState(120)
  const [galleryContainerWidth, setGalleryContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeImageSizePreset = imageSizePreset ?? 'md'

  const getCalculatedSize = useCallback((preset: SizePreset, containerWidth: number): number => {
    const columnsByPreset: Record<SizePreset, number> = {
      xs: 6,
      sm: 4,
      md: 3,
      lg: 2,
      xl: 1,
    }
    const columns = columnsByPreset[preset]
    const gap = 8
    const maxSize = containerWidth > 0 ? Math.min(520, containerWidth - 20) : 300
    const newSize = ensureEven((containerWidth - (columns - 1) * gap) / columns)

    return Math.max(60, Math.min(newSize, maxSize))
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 使用 requestAnimationFrame 避免同步 setState
    const updateWidth = () => {
      requestAnimationFrame(() => {
        setGalleryContainerWidth(container.offsetWidth)
      })
    }

    // 初始化宽度
    updateWidth()

    const handleResize = () => {
      updateWidth()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setImageSize(getCalculatedSize(activeImageSizePreset, galleryContainerWidth))
  }, [activeImageSizePreset, galleryContainerWidth, getCalculatedSize])

  const handleItemClick = (item: Item) => {
    if (onItemView) {
      onItemView(item.id)
    }
  }

  return (
    <div ref={containerRef} id="item-gallery-container" className="w-full">
      {items.length === 0 ? (
        <div className="text-muted-foreground py-10 text-center">
          {t('thing.no_items', '暂无可显示的物品。')}
        </div>
      ) : (
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${imageSize}px, 1fr))`,
            justifyItems: 'center',
          }}
        >
          {items.map(item => (
            <GalleryItem
              key={item.id}
              item={item}
              imageSize={imageSize}
              onClick={handleItemClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
