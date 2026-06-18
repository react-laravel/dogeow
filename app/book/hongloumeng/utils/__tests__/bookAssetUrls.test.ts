import { afterEach, describe, expect, it, vi } from 'vitest'
import { getHongloumengBookUrl, HONGLOUMENG_BOOK_BASE } from '../bookAssetUrls'

describe('bookAssetUrls', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('builds upyun urls for book json files', () => {
    vi.stubEnv('NEXT_PUBLIC_ASSET_BASE_URL', 'https://upyun.dogeow.com')

    expect(HONGLOUMENG_BOOK_BASE).toBe('https://upyun.dogeow.com/books/hongloumeng')
    expect(getHongloumengBookUrl('index.json')).toBe(
      'https://upyun.dogeow.com/books/hongloumeng/index.json'
    )
    expect(getHongloumengBookUrl('/chapters/001.json')).toBe(
      'https://upyun.dogeow.com/books/hongloumeng/chapters/001.json'
    )
  })
})
