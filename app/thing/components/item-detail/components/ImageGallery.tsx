import React, { memo, useEffect } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import ImagePlaceholder from '@/components/ui/icons/image-placeholder'
import type { Item } from '@/app/thing/types'
import { preloadThingGalleryImages } from '@/app/thing/utils/imagePreload'
import { THING_IMAGE_CLASS, THING_IMAGE_FRAME_CLASS } from '../../thingImageStyles'

interface ImageGalleryProps {
  images: Item['images']
  itemName: string
  activeIndex: number
  onIndexChange: (index: number) => void
}

export const ImageGallery = memo<ImageGalleryProps>(
  ({ images, itemName, activeIndex, onIndexChange }) => {
    useEffect(() => {
      preloadThingGalleryImages(images)
    }, [images])

    if (!images || images.length === 0) {
      return (
        <div className="bg-muted flex h-48 items-center justify-center rounded-lg">
          <ImagePlaceholder className="text-gray-400 opacity-40" size={64} />
        </div>
      )
    }

    const safeIndex = Math.min(Math.max(activeIndex, 0), images.length - 1)
    const currentImage = images[safeIndex]
    const url = currentImage?.url ?? ''
    const isRmbgProcessing =
      currentImage?.rmbg_status === 'pending' || currentImage?.rmbg_status === 'processing'

    return (
      <div className="space-y-3">
        <div className="flex w-full justify-center">
          <div className="relative max-w-full">
            <Image
              src={url}
              alt={itemName}
              width={0}
              height={0}
              sizes="100vw"
              className={`h-auto max-h-[min(70vh,560px)] w-auto max-w-full ${THING_IMAGE_CLASS}`}
              style={{
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                backgroundColor: 'transparent',
              }}
              priority
              unoptimized
            />
            {isRmbgProcessing ? (
              <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs text-white">
                <Loader2 className="h-3 w-3 animate-spin" />
                去背景中，完成后自动更新
              </div>
            ) : null}
          </div>
        </div>

        {images.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 py-2">
            {images.map((image, index: number) => (
              <div
                key={image.id}
                className={`${THING_IMAGE_FRAME_CLASS} relative h-16 w-16 cursor-pointer rounded-md border-2 transition-all ${
                  index === activeIndex
                    ? 'border-primary ring-primary/20 ring-2'
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
                onClick={() => onIndexChange(index)}
              >
                <Image
                  src={image.thumbnail_url ?? ''}
                  alt={`${itemName} 图片 ${index + 1}`}
                  width={64}
                  height={64}
                  className={THING_IMAGE_CLASS}
                  style={{
                    width: 'auto',
                    height: 'auto',
                    maxWidth: 64,
                    maxHeight: 64,
                    backgroundColor: 'transparent',
                  }}
                  sizes="64px"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)

ImageGallery.displayName = 'ImageGallery'
