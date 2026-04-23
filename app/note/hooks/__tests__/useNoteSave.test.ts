import { renderHook, act, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNoteSave } from '../useNoteSave'

const {
  mockPush,
  mockRefresh,
  mockToastError,
  mockToastInfo,
  mockToastSuccess,
  mockWithTransaction,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockToastError: vi.fn(),
  mockToastInfo: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockWithTransaction: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
    info: mockToastInfo,
    success: mockToastSuccess,
  },
}))

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}))

vi.mock('@/lib/utils/transaction', () => ({
  withTransaction: mockWithTransaction,
}))

describe('useNoteSave', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reset isSaving when save transaction fails', async () => {
    mockWithTransaction.mockResolvedValue({
      success: false,
      error: new Error('transaction failed'),
    })

    const { result } = renderHook(() => useNoteSave({ isEditing: false, draft: false }))

    await act(async () => {
      await expect(
        result.current.handleSave(
          '测试标题',
          '{"type":"doc","content":[{"type":"paragraph","content":[]}]}'
        )
      ).rejects.toThrow('transaction failed')
    })

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false)
    })

    expect(mockToastError).toHaveBeenCalledWith('保存失败')
    expect(mockPush).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
