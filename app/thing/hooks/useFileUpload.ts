import { useState, useCallback, useRef } from 'react'
import { uploadFile } from '@/lib/api'
import { logger } from '@/lib/logger'

interface UploadProgress {
  loaded: number
  total: number
  percent: number
  fileName: string
}

interface UseFileUploadOptions {
  onProgress?: (progress: UploadProgress) => void
  onSuccess?: (result: unknown) => void
  onError?: (error: Error) => void
}

interface UseFileUploadState {
  isUploading: boolean
  progress: UploadProgress | null
  error: Error | null
}

/**
 * Hook for managing file uploads with progress tracking
 *
 * Usage:
 * ```tsx
 * const { isUploading, progress, upload } = useFileUpload({
 *   onProgress: (p) => setProgress(p.percent),
 * })
 *
 * const handleUpload = async (files: File[]) => {
 *   await upload('/upload/images', files)
 * }
 * ```
 */
export function useFileUpload(options?: UseFileUploadOptions) {
  const [state, setState] = useState<UseFileUploadState>({
    isUploading: false,
    progress: null,
    error: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Upload files to the specified endpoint
   * Tracks progress and handles errors
   */
  const upload = useCallback(
    async (endpoint: string, files: File[]) => {
      if (files.length === 0) {
        logger.warn('useFileUpload: No files provided')
        return
      }

      // Cancel any in-progress upload
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      const formData = new FormData()

      // Add all files to form data
      files.forEach(file => {
        formData.append('images[]', file)
      })

      setState({
        isUploading: true,
        progress: null,
        error: null,
      })

      try {
        // Simulate progress tracking (browsers don't provide native XMLHttpRequest progress for fetch)
        // For real progress tracking, use XMLHttpRequest instead of fetch
        let uploadedSize = 0
        const totalSize = files.reduce((sum, file) => sum + file.size, 0)

        // Simulate gradual progress over upload duration
        const progressInterval = setInterval(() => {
          const increment = totalSize * 0.15 // Simulate 15% per interval
          uploadedSize = Math.min(uploadedSize + increment, totalSize * 0.95)

          const progress: UploadProgress = {
            loaded: Math.floor(uploadedSize),
            total: totalSize,
            percent: Math.floor((uploadedSize / totalSize) * 100),
            fileName: files.length === 1 ? files[0].name : `${files.length} files`,
          }

          setState(prev => ({
            ...prev,
            progress,
          }))

          options?.onProgress?.(progress)
        }, 200)

        // Perform actual upload
        const result = await uploadFile(endpoint, formData)

        // Complete progress
        clearInterval(progressInterval)
        const finalProgress: UploadProgress = {
          loaded: totalSize,
          total: totalSize,
          percent: 100,
          fileName: files.length === 1 ? files[0].name : `${files.length} files`,
        }

        setState(prev => ({
          ...prev,
          isUploading: false,
          progress: finalProgress,
        }))

        options?.onProgress?.(finalProgress)
        options?.onSuccess?.(result)

        logger.debug('useFileUpload: Upload completed', {
          endpoint,
          files: files.length,
          totalSize,
        })

        return result
      } catch (error) {
        clearInterval(abortControllerRef.current?.signal.aborted ? 0 : undefined)

        if (error instanceof Error && error.name === 'AbortError') {
          logger.debug('useFileUpload: Upload cancelled')
          setState(prev => ({
            ...prev,
            isUploading: false,
            progress: null,
          }))
          return
        }

        const err = error instanceof Error ? error : new Error(String(error))
        setState(prev => ({
          ...prev,
          isUploading: false,
          error: err,
        }))

        logger.error('useFileUpload: Upload failed', err)
        options?.onError?.(err)

        throw err
      }
    },
    [options]
  )

  /**
   * Cancel the current upload
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: null,
      }))
    }
  }, [])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }))
  }, [])

  return {
    ...state,
    upload,
    cancel,
    clearError,
  }
}
