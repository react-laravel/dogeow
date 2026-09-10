import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from '../route'

describe('book audio manifest route', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects unsafe identifiers', async () => {
    const response = await GET(
      new Request('http://localhost/api/book-audio-manifest?book=../luxun&chapter=0-0&voice=serena')
    )
    expect(response.status).toBe(400)
  })

  it('returns available pairs from the CDN manifest', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ pairs: [{ index: 0 }, { index: 3 }] }),
      })
    )
    const response = await GET(
      new Request('http://localhost/api/book-audio-manifest?book=luxun&chapter=0-0&voice=serena')
    )
    await expect(response.json()).resolves.toEqual({ available: true, pairs: [0, 3] })
  })

  it('returns unavailable when the manifest is missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const response = await GET(
      new Request('http://localhost/api/book-audio-manifest?book=luxun&chapter=0-1&voice=uncle_fu')
    )
    await expect(response.json()).resolves.toEqual({ available: false, pairs: [] })
  })
})
