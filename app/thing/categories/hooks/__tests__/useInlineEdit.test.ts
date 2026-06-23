import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInlineEdit } from '../useInlineEdit'

describe('useInlineEdit', () => {
  it('initializes with no editing state', () => {
    const { result } = renderHook(() => useInlineEdit())
    expect(result.current.editingId).toBeNull()
    expect(result.current.editingValue).toBe('')
  })

  it('returns all expected functions', () => {
    const { result } = renderHook(() => useInlineEdit())
    expect(typeof result.current.startEdit).toBe('function')
    expect(typeof result.current.cancelEdit).toBe('function')
    expect(typeof result.current.handleKeyDown).toBe('function')
    expect(typeof result.current.setEditingValue).toBe('function')
    expect(typeof result.current.isEditing).toBe('function')
    expect(result.current.inputRef).toBeDefined()
  })

  it('starts editing with correct id and value', () => {
    const { result } = renderHook(() => useInlineEdit())

    act(() => {
      result.current.startEdit(42, 'current name')
    })

    expect(result.current.editingId).toBe(42)
    expect(result.current.editingValue).toBe('current name')
  })

  it('isEditing returns false for different id', () => {
    const { result } = renderHook(() => useInlineEdit())

    act(() => {
      result.current.startEdit(1, 'test')
    })

    expect(result.current.isEditing(1)).toBe(true)
    expect(result.current.isEditing(2)).toBe(false)
    expect(result.current.isEditing(99)).toBe(false)
  })

  it('isEditing returns false when not editing', () => {
    const { result } = renderHook(() => useInlineEdit())
    expect(result.current.isEditing(1)).toBe(false)
  })

  it('cancelEdit resets state', () => {
    const { result } = renderHook(() => useInlineEdit())

    act(() => {
      result.current.startEdit(42, 'test value')
    })

    expect(result.current.editingId).toBe(42)

    act(() => {
      result.current.cancelEdit()
    })

    expect(result.current.editingId).toBeNull()
    expect(result.current.editingValue).toBe('')
  })

  it('setEditingValue updates the editing value', () => {
    const { result } = renderHook(() => useInlineEdit())

    act(() => {
      result.current.startEdit(42, 'initial')
    })

    act(() => {
      result.current.setEditingValue('updated')
    })

    expect(result.current.editingValue).toBe('updated')
    expect(result.current.editingId).toBe(42)
  })

  it('handleKeyDown calls onSave on Enter key', () => {
    const { result } = renderHook(() => useInlineEdit())
    const onSave = vi.fn()
    const onCancel = vi.fn()

    act(() => {
      result.current.startEdit(42, 'test')
    })

    const event = new KeyboardEvent('keydown', { key: 'Enter' })
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() })

    act(() => {
      result.current.handleKeyDown(event as unknown as React.KeyboardEvent, onSave, onCancel)
    })

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
    expect(event.preventDefault).toHaveBeenCalled()
  })

  it('handleKeyDown calls onCancel on Escape key', () => {
    const { result } = renderHook(() => useInlineEdit())
    const onSave = vi.fn()
    const onCancel = vi.fn()

    act(() => {
      result.current.startEdit(42, 'test')
    })

    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() })

    act(() => {
      result.current.handleKeyDown(event as unknown as React.KeyboardEvent, onSave, onCancel)
    })

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onSave).not.toHaveBeenCalled()
    expect(event.preventDefault).toHaveBeenCalled()
  })

  it('handleKeyDown does nothing for other keys', () => {
    const { result } = renderHook(() => useInlineEdit())
    const onSave = vi.fn()
    const onCancel = vi.fn()

    act(() => {
      result.current.startEdit(42, 'test')
    })

    const event = new KeyboardEvent('keydown', { key: 'a' })

    act(() => {
      result.current.handleKeyDown(event as unknown as React.KeyboardEvent, onSave, onCancel)
    })

    expect(onSave).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('switches editing from one item to another', () => {
    const { result } = renderHook(() => useInlineEdit())

    act(() => {
      result.current.startEdit(1, 'item 1')
    })
    expect(result.current.editingId).toBe(1)

    act(() => {
      result.current.startEdit(2, 'item 2')
    })
    expect(result.current.editingId).toBe(2)
    expect(result.current.editingValue).toBe('item 2')
  })

  it('inputRef is stable across renders', () => {
    const { result, rerender } = renderHook(() => useInlineEdit())
    const firstRef = result.current.inputRef

    rerender()
    expect(result.current.inputRef).toBe(firstRef)
  })
})
