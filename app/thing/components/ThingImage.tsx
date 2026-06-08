'use client'

import Image, { type ImageProps } from 'next/image'
import { shouldUnoptimizeThingImageSrc } from '@/app/thing/utils/thingImageSrc'

export type ThingImageProps = ImageProps

export default function ThingImage({ src, unoptimized, ...props }: ThingImageProps) {
  const resolvedUnoptimized = unoptimized ?? shouldUnoptimizeThingImageSrc(src)

  return <Image src={src} unoptimized={resolvedUnoptimized} {...props} />
}
