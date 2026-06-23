import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useNoteDialogs } from '../useNoteDialogs'

describe('useNoteDialogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createOptions = {
    onAction: vi.fn().mockResolvedValue(undefined),
    title: 'Test Title',
    content: 'Test Content',
  }

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useNoteDialogs(createOptions))

    expect(result.current.showConfirmDialog).toBe(false)
    expect(result.current.pendingAction).toBeUndefined()
    expect(result.current.globalDialogOpen).toBe(false)
  })

  it('should show global dialog and return promise', async () => {
    const { result } = renderHook(() => useNoteDialogs(createOptions))

    const promise = result.current.showDialog()

    await waitFor(() => {
      expect(result.current.globalDialogOpen).toBe(true)
    })

    // Resolve the dialog
    act(() => {
      result.current.handleGlobalAction('save')
    })

    const resolved = await promise
    expect(resolved).toBe(true)
    await waitFor(() => {
      expect(result.current.globalDialogOpen).toBe(false)
    })
    expect(createOptions.onAction).toHaveBeenCalledWith('save', 'Test Title', 'Test Content')
  })

  it('should handle leave action', async () => {
    const { result } = renderHook(() => useNoteDialogs(createOptions))

    // Set a pending action first
    const mockPending = vi.fn()
    act(() => {
      result.current.setPendingAction(mockPending)
    })

    await act(async () => {
      await result.current.handleLeave('discard')
    })

    expect(createOptions.onAction).toHaveBeenCalledWith('discard', 'Test Title', 'Test Content')
    expect(mockPending).toHaveBeenCalled()
    await waitFor(() => {
      expect(result.current.showConfirmDialog).toBe(false)
    })
    expect(result.current.pendingAction).toBeUndefined()
  })

  it('should handle leave without pending action', async () => {
    const { result } = renderHook(() => useNoteDialogs(createOptions))

    await act(async () => {
      await result.current.handleLeave('save')
    })

    expect(createOptions.onAction).toHaveBeenCalledWith('save', 'Test Title', 'Test Content')
    expect(result.current.showConfirmDialog).toBe(false)
  })

  it('should toggle confirm dialog visibility', () => {
    const { result } = renderHook(() => useNoteDialogs(createOptions))

    expect(result.current.showConfirmDialog).toBe(false)

    act(() => {
      result.current.setShowConfirmDialog(true)
    })

    expect(result.current.showConfirmDialog).toBe(true)

    act(() => {
      result.current.setShowConfirmDialog(false)
    })

    expect(result.current.showConfirmDialog).toBe(false)
  })

  it('should toggle global dialog visibility', () => {
    const { result } = renderHook(() => useNoteDialogs(createOptions))

    expect(result.current.globalDialogOpen).toBe(false)

    act(() => {
      result.current.setGlobalDialogOpen(true)
    })

    expect(result.current.globalDialogOpen).toBe(true)
  })

  it('should handle saveDraft action', async () => {
    const { result } = renderHook(() => useNoteDialogs(createOptions))

    await act(async () => {
      await result.current.handleLeave('saveDraft')
    })

    expect(createOptions.onAction).toHaveBeenCalledWith('saveDraft', 'Test Title', 'Test Content')
  })

  it('should create independent promises for multiple showDialog calls', async () => {
    const { result } = renderHook(() => useNoteDialogs(createOptions))

    // Call showDialog twice to create two independent promises
    const promise1 = result.current.showDialog()

    await waitFor(() => {
      expect(result.current.globalDialogOpen).toBe(true)
    })

    // Resolve first dialog
    act(() => {
      result.current.handleGlobalAction('save')
    })

    const resolved1 = await promise1
    expect(resolved1).toBe(true)
    await waitFor(() => {
      expect(result.current.globalDialogOpen).toBe(false)
    })

    // Open second dialog
    act(() => {
      result.current.setGlobalDialogOpen(true)
    })

    const promise2 = result.current.showDialog()

    await waitFor(() => {
      expect(result.current.globalDialogOpen).toBe(true)
    })

    // Resolve second dialog
    act(() => {
      result.current.handleGlobalAction('discard')
    })

    const resolved2 = await promise2
    expect(resolved2).toBe(true)
    await waitFor(() => {
      expect(result.current.globalDialogOpen).toBe(false)
    })
  })

  it('should update onAction when options change', async () => {
    const onAction = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(({ options }) => useNoteDialogs(options), {
      initialProps: { options: createOptions },
    })

    await act(async () => {
      await result.current.handleLeave('save')
    })

    expect(createOptions.onAction).toHaveBeenCalledTimes(1)

    const newOptions = {
      onAction,
      title: 'New Title',
      content: 'New Content',
    }

    rerender({ options: newOptions })

    await act(async () => {
      await result.current.handleLeave('save')
    })

    expect(createOptions.onAction).toHaveBeenCalledTimes(1)
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onAction).toHaveBeenCalledWith('save', 'New Title', 'New Content')
  })
})
