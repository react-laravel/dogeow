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

  it.each(['vivian', 'serena', 'uncle_fu'])(
    'discovers uploaded %s audio without a bundled chapter catalog entry',
    async voice => {
      const fetchManifest = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          bookId: 'luxun',
          chapterId: '0-3',
          voice,
          pairCount: 52,
          pairs: [
            { index: 0, file: '000.mp3' },
            { index: 3, file: '003.mp3' },
          ],
        }),
      })
      vi.stubGlobal('fetch', fetchManifest)
      const response = await GET(
        new Request(
          `http://localhost/api/book-audio-manifest?book=luxun&chapter=0-3&voice=${voice}`
        )
      )
      expect(fetchManifest).toHaveBeenCalledWith(
        `https://upyun.dogeow.com/books/luxun/audio/presets-1.7b-v1/${voice}/0-3/manifest.json`,
        { cache: 'no-store' }
      )
      await expect(response.json()).resolves.toEqual({ available: true, pairs: [0, 3] })
    }
  )
})
