import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRemoveBgPreference } from '../useRemoveBgPreference'

// Mock rmbg utils
vi.mock('@/app/thing/utils/rmbg', () => ({
  getRemoveBgPreference: () => false,
  setRemoveBgPreference: vi.fn(),
}))

describe('useRemoveBgPreference', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useRemoveBgPreference())
    expect(typeof result.current.removeBgEnabled).toBe('boolean')
    expect(typeof result.current.setRemoveBgEnabled).toBe('function')
  })

  it('updates preference when setRemoveBgEnabled called', () => {
    const { result } = renderHook(() => useRemoveBgPreference())
    act(() => {
      result.current.setRemoveBgEnabled(true)
    })
    expect(result.current.removeBgEnabled).toBe(true)
  })

  it('can toggle preference', () => {
    const { result } = renderHook(() => useRemoveBgPreference())
    act(() => {
      result.current.setRemoveBgEnabled(true)
    })
    expect(result.current.removeBgEnabled).toBe(true)
    act(() => {
      result.current.setRemoveBgEnabled(false)
    })
    expect(result.current.removeBgEnabled).toBe(false)
  })
})
