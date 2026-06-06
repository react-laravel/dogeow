import type { RmbgStatus, UploadedImage } from '../types'

export const THING_REMOVE_BG_STORAGE_KEY = 'thing_remove_bg_enabled'

export type RmbgStatusResponse = {
  status: RmbgStatus | 'unknown'
  path?: string
  url?: string
  thumbnail_url?: string
  thumbnail_path?: string
  origin_path?: string
  origin_url?: string
  message?: string
}

export function getRemoveBgPreference(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(THING_REMOVE_BG_STORAGE_KEY) === '1'
}

export function setRemoveBgPreference(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(THING_REMOVE_BG_STORAGE_KEY, enabled ? '1' : '0')
}

export function applyRmbgResult(image: UploadedImage, result: RmbgStatusResponse): UploadedImage {
  return {
    ...image,
    path: result.path ?? image.path,
    url: result.url ?? image.url,
    thumbnail_url: result.thumbnail_url ?? image.thumbnail_url,
    thumbnail_path: result.thumbnail_path ?? image.thumbnail_path,
    origin_path: result.origin_path ?? image.origin_path,
    origin_url: result.origin_url ?? image.origin_url,
    rmbg_status: result.status === 'unknown' ? image.rmbg_status : result.status,
  }
}

export { waitForRmbgStatus, subscribeRmbgStatusUpdates, extractUploadUserId } from './rmbgRealtime'
export type { RmbgStatusEvent } from './rmbgRealtime'
