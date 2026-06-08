import { describe, expect, it } from 'vitest'
import { shouldUnoptimizeThingImageSrc } from '../thingImageSrc'

describe('shouldUnoptimizeThingImageSrc', () => {
  it('returns true for blob and data URLs', () => {
    expect(shouldUnoptimizeThingImageSrc('blob:http://localhost/abc')).toBe(true)
    expect(shouldUnoptimizeThingImageSrc('data:image/png;base64,abc')).toBe(true)
  })

  it('returns true for empty strings', () => {
    expect(shouldUnoptimizeThingImageSrc('')).toBe(true)
  })

  it('returns true for IPv4 API hosts', () => {
    expect(shouldUnoptimizeThingImageSrc('http://100.64.0.1:8000/storage/a.png')).toBe(true)
  })

  it('returns false for configured API hosts', () => {
    expect(shouldUnoptimizeThingImageSrc('https://next-api.dogeow.com/storage/a.png')).toBe(false)
    expect(shouldUnoptimizeThingImageSrc('http://localhost:8000/storage/a.png')).toBe(false)
  })
})
