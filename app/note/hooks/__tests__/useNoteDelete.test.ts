import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useNoteDelete } from '../useNoteDelete'

const { mockDel, mockToastSuccess, mockPush } = vi.hoisted(() => ({
  mockDel: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockPush: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  del: mockDel,
}))

vi.mock('sonner', () => ({
  toast: {
    success: mockToastSuccess,
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('useNoteDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)
  })

  it('should initialize with handleDelete function', () => {
    const { result } = renderHook(() => useNoteDelete('1'))

    expect(typeof result.current.handleDelete).toBe('function')
  })

  it('should not delete when noteId is undefined', async () => {
    const { result } = renderHook(() => useNoteDelete(undefined))

    await act(async () => {
      await result.current.handleDelete()
    })

    expect(mockDel).not.toHaveBeenCalled()
    expect(mockToastSuccess).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should not delete when user cancels confirmation', async () => {
    window.confirm = vi.fn(() => false)
    const { result } = renderHook(() => useNoteDelete('1'))

    await act(async () => {
      await result.current.handleDelete()
    })

    expect(mockDel).not.toHaveBeenCalled()
    expect(mockToastSuccess).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should delete note and navigate on confirmation', async () => {
    mockDel.mockResolvedValue({})
    const { result } = renderHook(() => useNoteDelete('1'))

    await act(async () => {
      await result.current.handleDelete()
    })

    expect(mockDel).toHaveBeenCalledWith('/notes/1')
    expect(mockToastSuccess).toHaveBeenCalledWith('笔记已删除')
    expect(mockPush).toHaveBeenCalledWith('/note')
  })

  it('should handle array noteId by using first element', async () => {
    mockDel.mockResolvedValue({})
    const { result } = renderHook(() => useNoteDelete(['42']))

    await act(async () => {
      await result.current.handleDelete()
    })

    expect(mockDel).toHaveBeenCalledWith('/notes/42')
  })

  it('should handle delete API error', async () => {
    mockDel.mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useNoteDelete('1'))

    // hook doesn't have try/catch, so the error propagates
    await expect(async () => {
      await act(async () => {
        await result.current.handleDelete()
      })
    }).rejects.toThrow('Delete failed')

    expect(mockDel).toHaveBeenCalledWith('/notes/1')
  })

  it('should handle string noteId directly', async () => {
    mockDel.mockResolvedValue({})
    const { result } = renderHook(() => useNoteDelete('99'))

    await act(async () => {
      await result.current.handleDelete()
    })

    expect(mockDel).toHaveBeenCalledWith('/notes/99')
  })
})
