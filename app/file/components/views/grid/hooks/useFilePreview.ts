import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/api'
import { getFileStorageUrl, withOptionalCacheBust } from '@/app/file/services/api'
import { PREVIEW_TYPES, type PreviewType } from '../utils/previewTypes'
import type { CloudFile, FilePreviewResponse } from '@/app/file/types'

/**
 * Resolve a displayable media URL for image previews.
 *
 * Contract (verified against frontend usage):
 * - Prefer `GET /cloud/files/:id/preview` → `{ type, url?, content?, message? }`.
 * - Image responses should include an absolute, temporary signed `url`.
 * - Fallback: list item `path` may already be a signed absolute URL, or a
 *   storage-relative path resolved via `getFileStorageUrl`.
 * - Never cache-bust signed URLs (breaks signature query).
 * - Authenticated preview endpoints must not be used as raw <img> src.
 */
export const useFilePreview = () => {
  const [previewFile, setPreviewFile] = useState<CloudFile | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<PreviewType | null>(null)

  const previewItem = useCallback(async (file: CloudFile) => {
    if (file.is_folder) return

    setPreviewFile(file)
    setPreviewContent(null)
    setPreviewUrl(null)
    setPreviewType(PREVIEW_TYPES.LOADING)

    try {
      const response = await apiRequest<FilePreviewResponse>(`/cloud/files/${file.id}/preview`)
      setPreviewType(response.type as PreviewType)

      if (response.type === PREVIEW_TYPES.IMAGE || response.type === PREVIEW_TYPES.PDF) {
        const apiUrl = response.url?.trim() || null
        if (apiUrl) {
          setPreviewUrl(withOptionalCacheBust(apiUrl))
          return
        }

        // API omitted url — fall back to list path for images only
        if (response.type === PREVIEW_TYPES.IMAGE && file.path) {
          setPreviewUrl(withOptionalCacheBust(getFileStorageUrl(file.path)))
          return
        }

        setPreviewType(PREVIEW_TYPES.UNKNOWN)
        setPreviewContent(
          JSON.stringify({
            message: '无法获取预览地址',
            suggestion: '您可以尝试下载文件后查看',
          })
        )
        return
      }

      if (response.type === PREVIEW_TYPES.TEXT) {
        setPreviewContent(response.content ?? null)
        return
      }

      setPreviewContent(
        JSON.stringify({
          message: response.message || '此文件类型不支持预览',
          suggestion: response.suggestion || '您可以尝试下载文件后查看',
        })
      )
    } catch {
      // Preview API failed — last-resort path fallback for images
      if (file.type === 'image' && file.path) {
        setPreviewType(PREVIEW_TYPES.IMAGE)
        setPreviewUrl(withOptionalCacheBust(getFileStorageUrl(file.path)))
        return
      }

      toast.error('预览失败')
      setPreviewType(PREVIEW_TYPES.UNKNOWN)
      setPreviewContent(
        JSON.stringify({
          message: '预览失败，请稍后重试',
          suggestion: '您可以尝试下载文件后查看',
        })
      )
    }
  }, [])

  const closePreview = useCallback(() => {
    setPreviewFile(null)
    setPreviewContent(null)
    setPreviewUrl(null)
    setPreviewType(null)
  }, [])

  return {
    previewFile,
    previewContent,
    previewUrl,
    previewType,
    previewItem,
    closePreview,
  }
}
