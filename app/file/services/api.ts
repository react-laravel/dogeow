import { API_URL } from '@/lib/api'
import useAuthStore from '@/stores/authStore'

// 文件相关URL生成函数（需鉴权，勿直接挂到 <img> / window.open）
export const getFilePreviewUrl = (fileId: number): string =>
  `${API_URL}/api/cloud/files/${fileId}/preview?thumb=true`

export const getFileDownloadUrl = (fileId: number): string =>
  `${API_URL}/api/cloud/files/${fileId}/download`

function isAbsoluteUrl(path: string): boolean {
  try {
    new URL(path)
    return true
  } catch {
    return false
  }
}

/** True when URL already carries signed access query (must not be mutated). */
export function isSignedMediaUrl(url: string): boolean {
  return /[?&](signature|expires)=/i.test(url)
}

/**
 * Resolve a list/detail `path` for <img> / media.
 * Backend list responses already return temporary signed raw URLs.
 */
export const getFileStorageUrl = (path: string): string => {
  if (!path) {
    return ''
  }

  if (isAbsoluteUrl(path)) {
    return path
  }

  const normalizedPath = path.replace(/^\/+/, '')
  const storagePath = normalizedPath.startsWith('storage/')
    ? normalizedPath
    : `storage/${normalizedPath}`

  return `${API_URL}/${storagePath}`
}

/**
 * Optional cache-bust for non-signed URLs only.
 * Never append to signed URLs — a second `?` breaks the signature.
 */
export function withOptionalCacheBust(url: string, bust: number | string = Date.now()): string {
  if (!url || isSignedMediaUrl(url)) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}t=${bust}`
}

/** Authenticated blob download (window.open cannot send Bearer). */
export async function downloadCloudFile(file: {
  id: number
  name: string
  original_name?: string | null
}): Promise<void> {
  const token = useAuthStore.getState().token
  const headers = new Headers()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(getFileDownloadUrl(file.id), {
    method: 'GET',
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('下载失败')
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = file.original_name || file.name
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}
