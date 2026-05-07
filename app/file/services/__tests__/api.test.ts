import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({ API_URL: 'http://localhost:8000' }))

import { getFileStorageUrl } from '../api'

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
})
