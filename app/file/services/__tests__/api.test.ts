import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({ API_URL: 'http://localhost:8000' }))

import {
  getFileStorageUrl,
  getFilePreviewUrl,
  getFileDownloadUrl,
  withOptionalCacheBust,
} from '../api'

describe('getFileStorageUrl', () => {
  it('returns full absolute urls unchanged', () => {
    expect(getFileStorageUrl('http://localhost:8000/storage/uploads/image.png')).toBe(
      'http://localhost:8000/storage/uploads/image.png'
    )
  })

  it('returns root-relative storage urls with Api url prefix', () => {
    expect(getFileStorageUrl('/storage/uploads/image.png')).toBe(
      'http://localhost:8000/storage/uploads/image.png'
    )
  })

  it('prefixes relative storage paths with /storage/ under the Api url', () => {
    expect(getFileStorageUrl('uploads/image.png')).toBe(
      'http://localhost:8000/storage/uploads/image.png'
    )
  })

  it('returns empty string for empty path', () => {
    expect(getFileStorageUrl('')).toBe('')
  })

  it('handles absolute URLs with https', () => {
    expect(getFileStorageUrl('https://cdn.example.com/file.jpg')).toBe(
      'https://cdn.example.com/file.jpg'
    )
  })

  it('strips multiple leading slashes', () => {
    expect(getFileStorageUrl('///uploads/file.jpg')).toBe(
      'http://localhost:8000/storage/uploads/file.jpg'
    )
  })
})

describe('withOptionalCacheBust', () => {
  it('leaves signed URLs untouched', () => {
    const signed = 'http://localhost:8000/api/cloud/files/1/raw?expires=1&signature=abc'
    expect(withOptionalCacheBust(signed, 123)).toBe(signed)
  })

  it('appends t= for unsigned URLs', () => {
    expect(withOptionalCacheBust('http://localhost:8000/storage/a.jpg', 99)).toBe(
      'http://localhost:8000/storage/a.jpg?t=99'
    )
  })

  it('uses & when query already exists', () => {
    expect(withOptionalCacheBust('http://localhost:8000/a.jpg?x=1', 99)).toBe(
      'http://localhost:8000/a.jpg?x=1&t=99'
    )
  })
})

describe('getFilePreviewUrl', () => {
  it('generates correct preview URL', () => {
    expect(getFilePreviewUrl(123)).toBe(
      'http://localhost:8000/api/cloud/files/123/preview?thumb=true'
    )
  })

  it('handles file ID 1', () => {
    expect(getFilePreviewUrl(1)).toContain('/files/1/preview?thumb=true')
  })
})

describe('getFileDownloadUrl', () => {
  it('generates correct download URL', () => {
    expect(getFileDownloadUrl(456)).toBe('http://localhost:8000/api/cloud/files/456/download')
  })

  it('handles file ID 1', () => {
    expect(getFileDownloadUrl(1)).toContain('/files/1/download')
  })
})
