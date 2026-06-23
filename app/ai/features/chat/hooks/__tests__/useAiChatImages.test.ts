import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAiChatImages } from '../useAiChatImages'

describe('useAiChatImages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    URL.revokeObjectURL = vi.fn()
    URL.createObjectURL = vi.fn(() => `blob:test-${Math.random()}`)
  })

  const createFile = (name = 'test.png', type = 'image/png') => {
    return new File(['image-content'], name, { type })
  }

  describe('initial state', () => {
    it('starts with empty images', () => {
      const { result } = renderHook(() =>
        useAiChatImages({
          enabled: true,
          uploadImage: vi.fn().mockResolvedValue('https://example.com/img.png'),
        })
      )
      expect(result.current.images).toEqual([])
      expect(result.current.hasImages).toBe(false)
      expect(result.current.isUploadingImages).toBe(false)
    })
  })

  describe('handleImageSelect', () => {
    it('adds images when enabled and files are provided', async () => {
      const uploadImage = vi.fn().mockResolvedValue('https://example.com/img.png')
      const { result } = renderHook(() => useAiChatImages({ enabled: true, uploadImage }))

      const file = createFile()
      const fileList = {
        0: file,
        length: 1,
        item: (i: number) => (i === 0 ? file : null),
      } as unknown as FileList

      act(() => {
        result.current.handleImageSelect(fileList)
      })

      expect(result.current.images).toHaveLength(1)
      expect(result.current.images[0].preview).toMatch(/^blob:/)
      expect(result.current.images[0].uploading).toBe(true)
    })

    it('ignores files when disabled', async () => {
      const uploadImage = vi.fn().mockResolvedValue('https://example.com/img.png')
      const { result } = renderHook(() => useAiChatImages({ enabled: false, uploadImage }))

      const file = createFile()
      const fileList = {
        0: file,
        length: 1,
        item: (i: number) => (i === 0 ? file : null),
      } as unknown as FileList

      act(() => {
        result.current.handleImageSelect(fileList)
      })

      expect(result.current.images).toHaveLength(0)
      expect(uploadImage).not.toHaveBeenCalled()
    })

    it('ignores null files', async () => {
      const uploadImage = vi.fn().mockResolvedValue('https://example.com/img.png')
      const { result } = renderHook(() => useAiChatImages({ enabled: true, uploadImage }))

      act(() => {
        result.current.handleImageSelect(null)
      })

      expect(result.current.images).toHaveLength(0)
    })

    it('ignores non-image files', async () => {
      const uploadImage = vi.fn().mockResolvedValue('https://example.com/img.png')
      const { result } = renderHook(() => useAiChatImages({ enabled: true, uploadImage }))

      const file = new File(['text'], 'test.txt', { type: 'text/plain' })
      const fileList = {
        0: file,
        length: 1,
        item: (i: number) => (i === 0 ? file : null),
      } as unknown as FileList

      act(() => {
        result.current.handleImageSelect(fileList)
      })

      expect(result.current.images).toHaveLength(0)
    })

    it('respects maxImageCount limit', async () => {
      const uploadImage = vi.fn().mockResolvedValue('https://example.com/img.png')
      const { result } = renderHook(() =>
        useAiChatImages({ enabled: true, maxImageCount: 2, uploadImage })
      )

      const file1 = createFile('1.png')
      const file2 = createFile('2.png')
      const file3 = createFile('3.png')
      const fileList = [file1, file2, file3] as unknown as FileList

      act(() => {
        result.current.handleImageSelect(fileList)
      })

      expect(result.current.images).toHaveLength(2)
    })

    it('calls uploadImage for each valid file', async () => {
      const uploadImage = vi.fn().mockResolvedValue('https://example.com/img.png')
      const { result } = renderHook(() => useAiChatImages({ enabled: true, uploadImage }))

      const file1 = createFile('1.png')
      const file2 = createFile('2.png')
      const fileList = [file1, file2] as unknown as FileList

      act(() => {
        result.current.handleImageSelect(fileList)
      })

      expect(uploadImage).toHaveBeenCalledTimes(2)
    })

    it('marks image as not uploading after successful upload', async () => {
      const uploadImage = vi.fn().mockResolvedValue('https://example.com/img.png')
      const { result } = renderHook(() => useAiChatImages({ enabled: true, uploadImage }))

      const file = createFile()
      const fileList = {
        0: file,
        length: 1,
        item: (i: number) => (i === 0 ? file : null),
      } as unknown as FileList

      act(() => {
        result.current.handleImageSelect(fileList)
      })

      expect(result.current.images[0].uploading).toBe(true)

      await act(async () => {
        await uploadImage.mock.results[0].value
      })

      expect(result.current.images[0].uploading).toBe(false)
      expect(result.current.images[0].url).toBe('https://example.com/img.png')
    })
  })

  describe('removeImage', () => {
    it('removes image at given index', async () => {
      const uploadImage = vi.fn().mockResolvedValue('https://example.com/img.png')
      const { result } = renderHook(() => useAiChatImages({ enabled: true, uploadImage }))

      const file1 = createFile('1.png')
      const file2 = createFile('2.png')
      const fileList = [file1, file2] as unknown as FileList

      act(() => {
        result.current.handleImageSelect(fileList)
      })

      expect(result.current.images).toHaveLength(2)

      act(() => {
        result.current.removeImage(0)
      })

      expect(result.current.images).toHaveLength(1)
      expect(result.current.images[0].preview).toMatch(/^blob:/)
    })
  })

  describe('clearImages', () => {
    it('clears all images', async () => {
      const uploadImage = vi.fn().mockResolvedValue('https://example.com/img.png')
      const { result } = renderHook(() => useAiChatImages({ enabled: true, uploadImage }))

      const file = createFile()
      const fileList = {
        0: file,
        length: 1,
        item: (i: number) => (i === 0 ? file : null),
      } as unknown as FileList

      act(() => {
        result.current.handleImageSelect(fileList)
      })

      expect(result.current.images).toHaveLength(1)

      act(() => {
        result.current.clearImages()
      })

      expect(result.current.images).toHaveLength(0)
    })

    it('does nothing when already empty', () => {
      const { result } = renderHook(() =>
        useAiChatImages({
          enabled: true,
          uploadImage: vi.fn().mockResolvedValue('https://example.com/img.png'),
        })
      )

      act(() => {
        result.current.clearImages()
      })

      expect(result.current.images).toHaveLength(0)
    })
  })

  describe('isUploadingImages', () => {
    it('is true when any image is uploading', async () => {
      const uploadImage = vi
        .fn()
        .mockImplementation(
          () =>
            new Promise<string>(resolve =>
              setTimeout(() => resolve('https://example.com/img.png'), 100)
            )
        )
      const { result } = renderHook(() => useAiChatImages({ enabled: true, uploadImage }))

      const file = createFile()
      const fileList = {
        0: file,
        length: 1,
        item: (i: number) => (i === 0 ? file : null),
      } as unknown as FileList

      act(() => {
        result.current.handleImageSelect(fileList)
      })

      expect(result.current.isUploadingImages).toBe(true)
    })
  })
})
