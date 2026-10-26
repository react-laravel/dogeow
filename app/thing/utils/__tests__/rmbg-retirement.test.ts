import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyRmbgResult,
  getRemoveBgPreference,
  setRemoveBgPreference,
  THING_REMOVE_BG_STORAGE_KEY,
} from '../rmbg'

describe('automatic background removal retirement', () => {
  beforeEach(() => window.localStorage.clear())

  it('does not restore an old enabled preference', () => {
    window.localStorage.setItem(THING_REMOVE_BG_STORAGE_KEY, '1')
    expect(getRemoveBgPreference()).toBe(false)
  })

  it('does not persist a new enabled preference', () => {
    setRemoveBgPreference(true)
    expect(window.localStorage.getItem(THING_REMOVE_BG_STORAGE_KEY)).toBe('0')
    expect(getRemoveBgPreference()).toBe(false)
  })

  it('keeps historical completed images and their original reference available', () => {
    const result = applyRmbgResult(
      {
        path: 'uploads/1/image.jpg',
        url: 'https://example.com/image.jpg',
        thumbnail_path: 'uploads/1/image-thumb.jpg',
        thumbnail_url: 'https://example.com/image-thumb.jpg',
        origin_path: 'uploads/1/origin.jpg',
      },
      { status: 'done', path: 'uploads/1/image.png', url: 'https://example.com/image.png' }
    )
    expect(result.path).toBe('uploads/1/image.png')
    expect(result.origin_path).toBe('uploads/1/origin.jpg')
    expect(result.rmbg_status).toBe('done')
  })
})
