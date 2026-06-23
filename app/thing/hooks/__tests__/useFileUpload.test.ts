import { describe, expect, it, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFileUpload } from '../useFileUpload'
import { uploadFile } from '@/lib/api'

// Mock uploadFile
vi.mock('@/lib/api', () => ({
  uploadFile: vi.fn().mockResolvedValue([{ id: 1, url: 'http://example.com/img.jpg' }]),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useFileUpload', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useFileUpload())
    expect(result.current.isUploading).toBe(false)
    expect(result.current.progress).toBe(null)
    expect(result.current.error).toBe(null)
  })

  it('has upload, cancel, and clearError methods', () => {
    const { result } = renderHook(() => useFileUpload())
    expect(typeof result.current.upload).toBe('function')
    expect(typeof result.current.cancel).toBe('function')
    expect(typeof result.current.clearError).toBe('function')
  })

  it('does not upload when no files provided', async () => {
    const { result } = renderHook(() => useFileUpload())
    await act(async () => {
      await result.current.upload('/upload/images', [])
    })
    expect(result.current.isUploading).toBe(false)
  })

  it('calls onSuccess callback when upload succeeds', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useFileUpload({ onSuccess }))
    const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]
    await act(async () => {
      await result.current.upload('/upload/images', files)
    })
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })

  it('calls onError callback when upload fails', async () => {
    vi.mocked(uploadFile).mockRejectedValueOnce(new Error('Upload failed'))
    const onError = vi.fn()
    const { result } = renderHook(() => useFileUpload({ onError }))
    const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]
    await act(async () => {
      try {
        await result.current.upload('/upload/images', files)
      } catch {}
    })
    await waitFor(() => expect(onError).toHaveBeenCalled())
  })
})
