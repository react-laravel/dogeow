import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  applyRmbgResult,
  getRemoveBgPreference,
  setRemoveBgPreference,
  THING_REMOVE_BG_STORAGE_KEY,
} from '../rmbg'
import type { UploadedImage } from '../../types'

describe('rmbg utils', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('should persist remove background preference', () => {
    expect(getRemoveBgPreference()).toBe(false)

    setRemoveBgPreference(true)
    expect(window.localStorage.getItem(THING_REMOVE_BG_STORAGE_KEY)).toBe('1')
    expect(getRemoveBgPreference()).toBe(true)
  })

  it('should apply done result while keeping origin fields', () => {
    const image: UploadedImage = {
      path: 'uploads/1/abc.jpg',
      thumbnail_path: 'uploads/1/abc-thumb.jpg',
      url: 'https://example.com/abc.jpg',
      thumbnail_url: 'https://example.com/abc-thumb.jpg',
      origin_path: 'uploads/1/abc-origin.jpg',
      origin_url: 'https://example.com/abc-origin.jpg',
      rmbg_status: 'pending',
    }

    const updated = applyRmbgResult(image, {
      status: 'done',
      path: 'uploads/1/abc.png',
      url: 'https://example.com/abc.png',
      thumbnail_url: 'https://example.com/abc-thumb.png',
      thumbnail_path: 'uploads/1/abc-thumb.png',
    })

    expect(updated.path).toBe('uploads/1/abc.png')
    expect(updated.origin_path).toBe('uploads/1/abc-origin.jpg')
    expect(updated.rmbg_status).toBe('done')
  })
})
