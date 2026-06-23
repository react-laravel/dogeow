import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useBreadcrumbs } from '../useBreadcrumbs'

const { mockUseSWR } = vi.hoisted(() => {
  const mockUseSWR = vi.fn(() => ({
    data: undefined,
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: vi.fn(),
  }))
  return { mockUseSWR }
})

vi.mock('swr', () => ({
  default: mockUseSWR,
}))

// Mock the API get function
vi.mock('@/lib/api', () => ({
  get: vi.fn(),
}))

describe('useBreadcrumbs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    })
  })

  it('passes null key when currentFolderId is null', () => {
    renderHook(() => useBreadcrumbs(null))

    expect(mockUseSWR).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        dedupingInterval: 60000,
      })
    )
  })

  it('constructs breadcrumbs- prefixed key for a folder id', () => {
    renderHook(() => useBreadcrumbs(42))

    expect(mockUseSWR).toHaveBeenCalledWith(
      'breadcrumbs-42',
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 60000,
        errorRetryCount: 2,
        errorRetryInterval: 1000,
        keepPreviousData: true,
      })
    )
  })

  it('passes correct SWR options', () => {
    renderHook(() => useBreadcrumbs(1))

    const [, , options] = mockUseSWR.mock.calls[0]
    expect(options).toEqual({
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      keepPreviousData: true,
    })
  })
})
