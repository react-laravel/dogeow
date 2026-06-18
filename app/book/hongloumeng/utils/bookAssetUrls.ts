import { UPYUN_CDN_URL } from '@/lib/constants'

const BOOK_REMOTE_PREFIX = 'books/hongloumeng'

/** 红楼梦对照 JSON 在又拍云上的根路径 */
export const HONGLOUMENG_BOOK_BASE = `${UPYUN_CDN_URL}/${BOOK_REMOTE_PREFIX}`

export function getHongloumengBookUrl(relativePath: string): string {
  const normalized = relativePath.replace(/^\/+/, '')
  return `${HONGLOUMENG_BOOK_BASE}/${normalized}`
}
