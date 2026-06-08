import type { ImageProps } from 'next/image'

const IPV4_HOST = /^(\d{1,3}\.){3}\d{1,3}$/

/** blob/data 与 Tailscale 等 IP 直链无法走 Next 图片优化，需保留 unoptimized */
export function shouldUnoptimizeThingImageSrc(src: ImageProps['src']): boolean {
  if (typeof src !== 'string' || src.length === 0) {
    return true
  }

  if (src.startsWith('blob:') || src.startsWith('data:')) {
    return true
  }

  try {
    const { hostname } = new URL(src)
    return IPV4_HOST.test(hostname)
  } catch {
    return false
  }
}
