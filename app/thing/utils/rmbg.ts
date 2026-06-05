import { get } from '@/lib/api'
import type { RmbgStatus, UploadedImage } from '../types'

export const THING_REMOVE_BG_STORAGE_KEY = 'thing_remove_bg_enabled'

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 60

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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function pollRmbgStatus(
  path: string,
  onUpdate: (result: RmbgStatusResponse) => void
): Promise<'done' | 'failed' | 'timeout'> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS)

    const status = await get<RmbgStatusResponse>(
      `/upload/images/rmbg-status?path=${encodeURIComponent(path)}`
    )

    if (status.status === 'done') {
      onUpdate(status)
      return 'done'
    }

    if (status.status === 'failed') {
      onUpdate(status)
      return 'failed'
    }
  }

  return 'timeout'
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
