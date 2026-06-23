import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useNoteShortcuts } from '../useNoteShortcuts'

describe('useNoteShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should register keyboard event listener', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')

    const onSave = vi.fn()
    const onTogglePrivacy = vi.fn()

    renderHook(() =>
      useNoteShortcuts({
        title: 'Test Title',
        isSaving: false,
        onSave,
        onTogglePrivacy,
      })
    )

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    // Cleanup
    removeSpy.mockRestore()
    addSpy.mockRestore()
  })

  it('should remove keyboard event listener on unmount', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')

    const onSave = vi.fn()
    const onTogglePrivacy = vi.fn()

    const { unmount } = renderHook(() =>
      useNoteShortcuts({
        title: 'Test Title',
        isSaving: false,
        onSave,
        onTogglePrivacy,
      })
    )

    expect(addSpy).toHaveBeenCalled()

    unmount()

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    removeSpy.mockRestore()
    addSpy.mockRestore()
  })

  it('should trigger save on Ctrl+S when title is not empty and not saving', async () => {
    const onSave = vi.fn()
    const onTogglePrivacy = vi.fn()

    renderHook(() =>
      useNoteShortcuts({
        title: 'Test Title',
        isSaving: false,
        onSave,
        onTogglePrivacy,
      })
    )

    // Wait for useEffect to register the listener
    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled()
    })

    // Simulate Ctrl+S by dispatching event on document
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })

    document.dispatchEvent(event)

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onTogglePrivacy).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
  })

  it('should trigger save on Cmd+S', async () => {
    const onSave = vi.fn()
    const onTogglePrivacy = vi.fn()

    renderHook(() =>
      useNoteShortcuts({
        title: 'Test Title',
        isSaving: false,
        onSave,
        onTogglePrivacy,
      })
    )

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled()
    })

    const event = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    })

    document.dispatchEvent(event)

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('should trigger toggle privacy on Ctrl+Shift+P', async () => {
    const onSave = vi.fn()
    const onTogglePrivacy = vi.fn()

    renderHook(() =>
      useNoteShortcuts({
        title: 'Test Title',
        isSaving: false,
        onSave,
        onTogglePrivacy,
      })
    )

    await waitFor(() => {
      expect(onTogglePrivacy).not.toHaveBeenCalled()
    })

    const event = new KeyboardEvent('keydown', {
      key: 'P',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })

    document.dispatchEvent(event)

    expect(onTogglePrivacy).toHaveBeenCalledTimes(1)
    expect(onSave).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
  })

  it('should trigger toggle privacy on Cmd+Shift+P', async () => {
    const onSave = vi.fn()
    const onTogglePrivacy = vi.fn()

    renderHook(() =>
      useNoteShortcuts({
        title: 'Test Title',
        isSaving: false,
        onSave,
        onTogglePrivacy,
      })
    )

    await waitFor(() => {
      expect(onTogglePrivacy).not.toHaveBeenCalled()
    })

    const event = new KeyboardEvent('keydown', {
      key: 'P',
      metaKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })

    document.dispatchEvent(event)

    expect(onTogglePrivacy).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('should not trigger save when title is empty', async () => {
    const onSave = vi.fn()
    const onTogglePrivacy = vi.fn()

    renderHook(() =>
      useNoteShortcuts({
        title: '',
        isSaving: false,
        onSave,
        onTogglePrivacy,
      })
    )

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled()
    })

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })

    document.dispatchEvent(event)

    expect(onSave).not.toHaveBeenCalled()
  })

  it('should not trigger save when isSaving is true', async () => {
    const onSave = vi.fn()
    const onTogglePrivacy = vi.fn()

    renderHook(() =>
      useNoteShortcuts({
        title: 'Test Title',
        isSaving: true,
        onSave,
        onTogglePrivacy,
      })
    )

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled()
    })

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })

    document.dispatchEvent(event)

    expect(onSave).not.toHaveBeenCalled()
  })

  it('should not trigger toggle privacy when isSaving is true', async () => {
    const onSave = vi.fn()
    const onTogglePrivacy = vi.fn()

    renderHook(() =>
      useNoteShortcuts({
        title: 'Test Title',
        isSaving: true,
        onSave,
        onTogglePrivacy,
      })
    )

    await waitFor(() => {
      expect(onTogglePrivacy).not.toHaveBeenCalled()
    })

    const event = new KeyboardEvent('keydown', {
      key: 'P',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })

    document.dispatchEvent(event)

    expect(onTogglePrivacy).not.toHaveBeenCalled()
  })

  it('should re-register listener when title changes', async () => {
    const onSave = vi.fn()

    const { rerender } = renderHook(
      ({ title, isSaving, onSave: save, onTogglePrivacy }) =>
        useNoteShortcuts({ title, isSaving, onSave: save, onTogglePrivacy }),
      {
        initialProps: {
          title: 'Title 1',
          isSaving: false,
          onSave,
          onTogglePrivacy: vi.fn(),
        },
      }
    )

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled()
    })

    // New title should trigger save
    rerender({
      title: 'Title 2',
      isSaving: false,
      onSave,
      onTogglePrivacy: vi.fn(),
    })

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })

    document.dispatchEvent(event)

    expect(onSave).toHaveBeenCalledTimes(1)
  })
})
