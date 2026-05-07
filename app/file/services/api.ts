import { API_URL } from '@/lib/api'

// 文件相关URL生成函数
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
