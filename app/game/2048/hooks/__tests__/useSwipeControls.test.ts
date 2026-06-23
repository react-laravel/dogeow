import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSwipeControls } from '../useSwipeControls'

describe('useSwipeControls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not add listeners when disabled', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')

    renderHook(() =>
      useSwipeControls({
        onMove: vi.fn(),
        enabled: false,
      })
    )

    expect(addSpy).not.toHaveBeenCalledWith('touchstart', expect.any(Function))
    expect(addSpy).not.toHaveBeenCalledWith('touchmove', expect.any(Function))
    expect(addSpy).not.toHaveBeenCalledWith('touchend', expect.any(Function))
    addSpy.mockRestore()
  })

  it('should add listeners when enabled', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')

    renderHook(() =>
      useSwipeControls({
        onMove: vi.fn(),
        enabled: true,
      })
    )

    expect(addSpy).toHaveBeenCalledWith('touchstart', expect.any(Function))
    expect(addSpy).toHaveBeenCalledWith('touchmove', expect.any(Function))
    expect(addSpy).toHaveBeenCalledWith('touchend', expect.any(Function))
    addSpy.mockRestore()
  })

  it('should remove listeners on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')

    const { unmount } = renderHook(() =>
      useSwipeControls({
        onMove: vi.fn(),
        enabled: true,
      })
    )

    unmount()
    expect(removeSpy).toHaveBeenCalledWith('touchstart', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('touchmove', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('touchend', expect.any(Function))
    removeSpy.mockRestore()
  })

  it('should use default options', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')

    renderHook(() =>
      useSwipeControls({
        onMove: vi.fn(),
        enabled: true,
      })
    )

    expect(addSpy).toHaveBeenCalled()
    addSpy.mockRestore()
  })

  it('should accept custom options', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')

    renderHook(() =>
      useSwipeControls({
        onMove: vi.fn(),
        enabled: true,
        minDistance: 50,
        throttleMs: 300,
        targetSelector: '.custom-selector',
      })
    )

    expect(addSpy).toHaveBeenCalled()
    addSpy.mockRestore()
  })
})
