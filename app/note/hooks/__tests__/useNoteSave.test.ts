import { renderHook, act, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNoteSave } from '../useNoteSave'

const {
  mockPush,
  mockRefresh,
  mockToastError,
  mockToastInfo,
  mockToastSuccess,
  mockLoggerDebug,
  mockLoggerError,
  mockLoggerWarn,
  mockGenerateKey,
  mockGetPendingRequest,
  mockIsRequestPending,
  mockTrackRequest,
  mockWithTransaction,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockToastError: vi.fn(),
  mockToastInfo: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockLoggerDebug: vi.fn(),
  mockLoggerError: vi.fn(),
  mockLoggerWarn: vi.fn(),
  mockGenerateKey: vi.fn(),
  mockGetPendingRequest: vi.fn(),
  mockIsRequestPending: vi.fn(),
  mockTrackRequest: vi.fn(),
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

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: mockLoggerDebug,
    error: mockLoggerError,
    warn: mockLoggerWarn,
  },
}))

vi.mock('@/lib/utils/idempotency', () => ({
  idempotencyTracker: {
    generateKey: mockGenerateKey,
    getPendingRequest: mockGetPendingRequest,
    isRequestPending: mockIsRequestPending,
    trackRequest: mockTrackRequest,
  },
}))

vi.mock('@/lib/utils/transaction', () => ({
  withTransaction: mockWithTransaction,
}))

describe('useNoteSave', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateKey.mockReturnValue('dedupe-key')
    mockGetPendingRequest.mockReturnValue(undefined)
    mockIsRequestPending.mockReturnValue(false)
    mockTrackRequest.mockImplementation((_key: string, request: Promise<unknown>) => request)
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

  it('should reuse a pending save request and keep observability', async () => {
    mockIsRequestPending.mockReturnValue(true)
    mockGetPendingRequest.mockResolvedValue({ note: { id: 1 } })

    const { result } = renderHook(() => useNoteSave({ isEditing: false, draft: false }))

    await act(async () => {
      await expect(
        result.current.handleSave(
          '测试标题',
          '{"type":"doc","content":[{"type":"paragraph","content":[]}]}'
        )
      ).resolves.toBeUndefined()
    })

    expect(mockToastInfo).toHaveBeenCalledWith('保存请求已在处理中')
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      '[Idempotency] Save request already in progress, waiting for result'
    )
    expect(mockWithTransaction).not.toHaveBeenCalled()
    expect(result.current.isSaving).toBe(false)
  })

  it('should reuse a pending draft save request and keep observability', async () => {
    mockIsRequestPending.mockReturnValue(true)
    mockGetPendingRequest.mockResolvedValue({ note: { id: 1 } })

    const { result } = renderHook(() => useNoteSave({ isEditing: false, draft: false }))

    await act(async () => {
      await expect(
        result.current.saveDraft(
          '测试标题',
          '{"type":"doc","content":[{"type":"paragraph","content":[]}]}'
        )
      ).resolves.toBeUndefined()
    })

    expect(mockToastInfo).toHaveBeenCalledWith('保存请求已在处理中')
    expect(mockLoggerWarn).toHaveBeenCalledWith('[Idempotency] Draft save already in progress')
    expect(mockTrackRequest).not.toHaveBeenCalled()
    expect(result.current.isSaving).toBe(false)
  })
})
