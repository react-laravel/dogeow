import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useUncategorizedCount } from '../useUncategorizedCount'

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn().mockResolvedValue({
    data: [],
    meta: { total: 5 },
  }),
}))

describe('useUncategorizedCount', () => {
  it('initializes with loading state', () => {
    const { result } = renderHook(() => useUncategorizedCount())
    expect(result.current.loading).toBe(true)
    expect(result.current.count).toBe(0)
  })

  it('returns count from meta after loading', async () => {
    const { result } = renderHook(() => useUncategorizedCount())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.count).toBe(5)
  })

  it('has refresh method', () => {
    const { result } = renderHook(() => useUncategorizedCount())
    expect(typeof result.current.refresh).toBe('function')
  })
})
