import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  useCreateFolder,
  useDeleteFiles,
  useFileUpload,
  useMoveFiles,
  useRenameFile,
} from '../useFileOperations'

// Mock swr
vi.mock('swr', () => ({
  useSWRConfig: () => ({ mutate: vi.fn() }),
  useSWRMutation: ({ fn }: { fn: (url: string, arg: unknown) => Promise<unknown> }) => {
    const { trigger, isMutating } = (() => {
      let pending = false
      return {
        trigger: vi.fn(async (arg: unknown) => fn('/cloud/folders', { arg })),
        get isMutating() {
          return pending
        },
      }
    })()
    return { trigger, isMutating }
  },
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock file store
const mockUseFileStore = {
  currentFolderId: null as number | null,
  selectedFiles: [] as number[],
  setSelectedFiles: vi.fn(),
  navigateToFolder: vi.fn(),
  setCurrentView: vi.fn(),
  setSearchQuery: vi.fn(),
  handleSort: vi.fn(),
}
vi.mock('../store/useFileStore', () => ({
  default: () => mockUseFileStore,
}))

// Mock lib/api
const mockMutate = vi.fn()
vi.mock('@/lib/api', () => ({
  post: vi.fn(),
  del: vi.fn(),
  uploadFile: vi.fn(),
  handleApiError: vi.fn(),
}))

describe('useFileOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFileStore.currentFolderId = null
    mockUseFileStore.selectedFiles = []
  })

  describe('useCreateFolder', () => {
    it('should initialize with closed dialog and empty fields', () => {
      const { result } = renderHook(() => useCreateFolder())

      expect(result.current.isDialogOpen).toBe(false)
      expect(result.current.folderName).toBe('')
      expect(result.current.folderDescription).toBe('')
      expect(result.current.isLoading).toBe(false)
    })

    it('should toggle dialog via setIsDialogOpen', () => {
      const { result } = renderHook(() => useCreateFolder())

      act(() => {
        result.current.setIsDialogOpen(true)
      })
      expect(result.current.isDialogOpen).toBe(true)

      act(() => {
        result.current.setIsDialogOpen(false)
      })
      expect(result.current.isDialogOpen).toBe(false)
    })

    it('should reset form on dialog close', () => {
      const { result } = renderHook(() => useCreateFolder())

      act(() => {
        result.current.setFolderName('test-folder')
        result.current.setFolderDescription('desc')
      })

      expect(result.current.folderName).toBe('test-folder')
      expect(result.current.folderDescription).toBe('desc')

      act(() => {
        result.current.setIsDialogOpen(false)
      })

      expect(result.current.folderName).toBe('')
      expect(result.current.folderDescription).toBe('')
    })

    it('should not submit empty folder name', async () => {
      const { result } = renderHook(() => useCreateFolder())

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.isLoading).toBe(false)
    })

    it('should submit folder with valid name', async () => {
      const { post } = await import('@/lib/api')
      ;(post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({})

      const { result } = renderHook(() => useCreateFolder())

      act(() => {
        result.current.setFolderName('my-folder')
        result.current.setIsDialogOpen(true)
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(post).toHaveBeenCalledWith('/cloud/folders', {
        name: 'my-folder',
        parent_id: null,
        description: '',
      })
    })
  })

  describe('useFileUpload', () => {
    it('should initialize with no upload in progress', () => {
      const { result } = renderHook(() => useFileUpload())

      expect(result.current.isUploading).toBe(false)
      expect(result.current.uploadProgress).toEqual({})
    })

    it('should return early for no files', async () => {
      const { result } = renderHook(() => useFileUpload())

      const mockEvent = {
        target: { files: null, value: '' },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      await act(async () => {
        await result.current.handleFileUpload(mockEvent)
      })

      expect(result.current.isUploading).toBe(false)
    })

    it('should return early for empty file list', async () => {
      const { result } = renderHook(() => useFileUpload())

      const mockEvent = {
        target: { files: [] as FileList, value: '' },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      await act(async () => {
        await result.current.handleFileUpload(mockEvent)
      })

      expect(result.current.isUploading).toBe(false)
    })
  })

  describe('useDeleteFiles', () => {
    it('should initialize with not deleting', () => {
      const { result } = renderHook(() => useDeleteFiles())

      expect(result.current.isDeleting).toBe(false)
    })

    it('should not delete when no files selected', async () => {
      const { result } = renderHook(() => useDeleteFiles())

      await act(async () => {
        await result.current.deleteSelectedFiles()
      })

      expect(result.current.isDeleting).toBe(false)
    })

    it('should delete single file', async () => {
      const { del } = await import('@/lib/api')
      ;(del as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({})

      mockUseFileStore.currentFolderId = 1
      mockUseFileStore.selectedFiles = [42]

      const { result } = renderHook(() => useDeleteFiles())

      await act(async () => {
        await result.current.deleteFile(42)
      })

      expect(del).toHaveBeenCalledWith('/cloud/files/42')
    })
  })

  describe('useRenameFile', () => {
    it('should initialize with not renaming', () => {
      const { result } = renderHook(() => useRenameFile())

      expect(result.current.isRenaming).toBe(false)
    })

    it('should not rename empty name', async () => {
      const { result } = renderHook(() => useRenameFile())

      const success = await act(async () => {
        return await result.current.renameFile(1, '   ')
      })

      expect(success).toBe(false)
    })

    it('should rename file', async () => {
      const { post } = await import('@/lib/api')
      ;(post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({})

      const { result } = renderHook(() => useRenameFile())

      const success = await act(async () => {
        return await result.current.renameFile(1, 'new-name.txt')
      })

      expect(success).toBe(true)
      expect(post).toHaveBeenCalledWith('/cloud/files/1/rename', { name: 'new-name.txt' })
    })
  })

  describe('useMoveFiles', () => {
    it('should initialize with not moving', () => {
      const { result } = renderHook(() => useMoveFiles())

      expect(result.current.isMoving).toBe(false)
    })

    it('should not move empty file ids', async () => {
      const { result } = renderHook(() => useMoveFiles())

      const success = await act(async () => {
        return await result.current.moveFiles([], 2)
      })

      expect(success).toBe(false)
    })

    it('should move files', async () => {
      const { post } = await import('@/lib/api')
      ;(post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({})

      const { result } = renderHook(() => useMoveFiles())

      const success = await act(async () => {
        return await result.current.moveFiles([1, 2, 3], 5)
      })

      expect(success).toBe(true)
      expect(post).toHaveBeenCalledWith('/cloud/files/move', {
        file_ids: [1, 2, 3],
        target_folder_id: 5,
      })
    })

    it('should move files to root (null)', async () => {
      const { post } = await import('@/lib/api')
      ;(post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({})

      const { result } = renderHook(() => useMoveFiles())

      const success = await act(async () => {
        return await result.current.moveFiles([1], null)
      })

      expect(success).toBe(true)
      expect(post).toHaveBeenCalledWith('/cloud/files/move', {
        file_ids: [1],
        target_folder_id: null,
      })
    })
  })
})
