import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKeyboardControls } from '../useKeyboardControls'

describe('useKeyboardControls (2048)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not register listener when disabled', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')

    renderHook(() =>
      useKeyboardControls({
        onMove: vi.fn(),
        enabled: false,
      })
    )

    expect(addSpy).not.toHaveBeenCalled()
    addSpy.mockRestore()
  })

  it('should register listener when enabled', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')

    renderHook(() =>
      useKeyboardControls({
        onMove: vi.fn(),
        enabled: true,
      })
    )

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    addSpy.mockRestore()
  })

  it('should call onMove with left direction on ArrowLeft', () => {
    const onMove = vi.fn()

    renderHook(() =>
      useKeyboardControls({
        onMove,
        enabled: true,
      })
    )

    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
    window.dispatchEvent(event)

    expect(onMove).toHaveBeenCalledWith('left')
  })

  it('should call onMove with right direction on ArrowRight', () => {
    const onMove = vi.fn()

    renderHook(() =>
      useKeyboardControls({
        onMove,
        enabled: true,
      })
    )

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
    window.dispatchEvent(event)

    expect(onMove).toHaveBeenCalledWith('right')
  })

  it('should call onMove with up direction on ArrowUp', () => {
    const onMove = vi.fn()

    renderHook(() =>
      useKeyboardControls({
        onMove,
        enabled: true,
      })
    )

    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' })
    window.dispatchEvent(event)

    expect(onMove).toHaveBeenCalledWith('up')
  })

  it('should call onMove with down direction on ArrowDown', () => {
    const onMove = vi.fn()

    renderHook(() =>
      useKeyboardControls({
        onMove,
        enabled: true,
      })
    )

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    window.dispatchEvent(event)

    expect(onMove).toHaveBeenCalledWith('down')
  })

  it('should not call onMove for non-arrow keys', () => {
    const onMove = vi.fn()

    renderHook(() =>
      useKeyboardControls({
        onMove,
        enabled: true,
      })
    )

    const event = new KeyboardEvent('keydown', { key: 'a' })
    window.dispatchEvent(event)

    expect(onMove).not.toHaveBeenCalled()
  })

  it('should remove event listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() =>
      useKeyboardControls({
        onMove: vi.fn(),
        enabled: true,
      })
    )

    unmount()
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    removeSpy.mockRestore()
  })
})
