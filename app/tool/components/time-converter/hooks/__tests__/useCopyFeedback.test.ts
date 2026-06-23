import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCopyFeedback } from '../useCopyFeedback'

// Mock sonner
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args, { description: '', duration: 2000 }),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

describe('useCopyFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with both copy states as false', () => {
    const { result } = renderHook(() => useCopyFeedback())
    expect(result.current.copyStates.timestamp).toBe(false)
    expect(result.current.copyStates.dateTime).toBe(false)
  })

  it('returns copyToClipboard and cleanup functions', () => {
    const { result } = renderHook(() => useCopyFeedback())
    expect(typeof result.current.copyToClipboard).toBe('function')
    expect(typeof result.current.cleanup).toBe('function')
  })

  it('shows error toast when clipboard is unavailable', async () => {
    const { result } = renderHook(() => useCopyFeedback())

    // Ensure navigator.clipboard is undefined and execCommand returns false
    const originalClipboard = (navigator as unknown as Record<string, unknown>).clipboard
    const originalExecCommand = (document as unknown as Record<string, unknown>).execCommand

    ;(navigator as unknown as Record<string, unknown>).clipboard = undefined
    ;(document as unknown as Record<string, unknown>).execCommand = vi.fn(() => false)

    await act(async () => {
      await result.current.copyToClipboard('test', 'timestamp')
    })

    expect(mockToastError).toHaveBeenCalledWith('复制失败，请手动复制')
    ;(navigator as unknown as Record<string, unknown>).clipboard = originalClipboard
    ;(document as unknown as Record<string, unknown>).execCommand = originalExecCommand
  })

  it('does not set copy state when copy fails', async () => {
    const { result } = renderHook(() => useCopyFeedback())

    const originalClipboard = (navigator as unknown as Record<string, unknown>).clipboard
    const originalExecCommand = (document as unknown as Record<string, unknown>).execCommand

    ;(navigator as unknown as Record<string, unknown>).clipboard = undefined
    ;(document as unknown as Record<string, unknown>).execCommand = vi.fn(() => false)

    await act(async () => {
      await result.current.copyToClipboard('test', 'timestamp')
    })

    expect(result.current.copyStates.timestamp).toBe(false)
    ;(navigator as unknown as Record<string, unknown>).clipboard = originalClipboard
    ;(document as unknown as Record<string, unknown>).execCommand = originalExecCommand
  })

  it('cleanup clears all timers without error', async () => {
    const { result } = renderHook(() => useCopyFeedback())

    await act(async () => {
      result.current.cleanup()
    })

    // cleanup should not throw
    expect(result.current.copyStates.timestamp).toBe(false)
    expect(result.current.copyStates.dateTime).toBe(false)
  })

  it('copyToClipboard handles empty text', async () => {
    const { result } = renderHook(() => useCopyFeedback())

    const originalClipboard = (navigator as unknown as Record<string, unknown>).clipboard
    const originalExecCommand = (document as unknown as Record<string, unknown>).execCommand

    ;(navigator as unknown as Record<string, unknown>).clipboard = undefined
    ;(document as unknown as Record<string, unknown>).execCommand = vi.fn(() => false)

    await act(async () => {
      await result.current.copyToClipboard('', 'timestamp')
    })

    expect(mockToastError).toHaveBeenCalledWith('复制失败，请手动复制')
    ;(navigator as unknown as Record<string, unknown>).clipboard = originalClipboard
    ;(document as unknown as Record<string, unknown>).execCommand = originalExecCommand
  })
})
