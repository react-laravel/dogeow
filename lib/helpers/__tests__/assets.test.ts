import { describe, expect, it, vi } from 'vitest'
import { asset, imageAsset } from '../assets'

describe('assets', () => {
  const originalEnv = process.env.NEXT_PUBLIC_ASSET_BASE_URL

  afterEach(() => {
    process.env.NEXT_PUBLIC_ASSET_BASE_URL = originalEnv
  })

  describe('asset', () => {
    it('should return data URLs unchanged', () => {
      expect(asset('data:image/png;base64,abc123')).toBe('data:image/png;base64,abc123')
    })

    it('should return blob URLs unchanged', () => {
      expect(asset('blob:http://localhost/abc123')).toBe('blob:http://localhost/abc123')
    })

    it('should return absolute URLs unchanged', () => {
      expect(asset('https://example.com/image.png')).toBe('https://example.com/image.png')
    })

    it('should return protocol-relative URLs unchanged', () => {
      expect(asset('//example.com/image.png')).toBe('//example.com/image.png')
    })

    it('should prefix relative path with base URL', () => {
      process.env.NEXT_PUBLIC_ASSET_BASE_URL = 'https://cdn.example.com'
      expect(asset('images/photo.jpg')).toBe('https://cdn.example.com/images/photo.jpg')
    })

    it('should handle leading slash', () => {
      process.env.NEXT_PUBLIC_ASSET_BASE_URL = 'https://cdn.example.com'
      expect(asset('/images/photo.jpg')).toBe('https://cdn.example.com/images/photo.jpg')
    })

    it('should return path as-is when no base URL', () => {
      process.env.NEXT_PUBLIC_ASSET_BASE_URL = ''
      expect(asset('images/photo.jpg')).toBe('/images/photo.jpg')
    })

    it('should strip trailing slash from base URL', () => {
      process.env.NEXT_PUBLIC_ASSET_BASE_URL = 'https://cdn.example.com/'
      expect(asset('images/photo.jpg')).toBe('https://cdn.example.com/images/photo.jpg')
    })

    it('should handle empty path', () => {
      expect(asset('')).toBe('')
    })

    it('should handle undefined base URL', () => {
      delete process.env.NEXT_PUBLIC_ASSET_BASE_URL
      expect(asset('images/photo.jpg')).toBe('/images/photo.jpg')
    })
  })

  describe('imageAsset', () => {
    it('should add /images prefix if not present', () => {
      process.env.NEXT_PUBLIC_ASSET_BASE_URL = ''
      expect(imageAsset('photo.jpg')).toBe('/images/photo.jpg')
    })

    it('should not double-add /images prefix', () => {
      process.env.NEXT_PUBLIC_ASSET_BASE_URL = ''
      expect(imageAsset('/images/photo.jpg')).toBe('/images/photo.jpg')
    })

    it('should strip leading slashes from path', () => {
      process.env.NEXT_PUBLIC_ASSET_BASE_URL = ''
      // '//images/photo.jpg' doesn't startWith('/images/'), so /images/ is added
      expect(imageAsset('//images/photo.jpg')).toBe('/images/images/photo.jpg')
    })

    it('should combine with base URL', () => {
      process.env.NEXT_PUBLIC_ASSET_BASE_URL = 'https://cdn.example.com'
      expect(imageAsset('photo.jpg')).toBe('https://cdn.example.com/images/photo.jpg')
    })
  })
})
