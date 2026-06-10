'use client'

import Image, { type ImageProps } from 'next/image'

export type ThingImageProps = ImageProps

export default function ThingImage({ src, ...props }: ThingImageProps) {
  return <Image src={src} {...props} />
}
