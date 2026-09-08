import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import useSWR from 'swr'
import { useFileManagement } from '../useFileManagement'

vi.mock('swr', () => ({ default: vi.fn(() => ({ data: [], mutate: vi.fn(), isLoading: false })) }))
vi.mock('@/lib/api', () => ({ get: vi.fn() }))

describe('file list query', () => {
  it('keeps special characters in the search value instead of changing query parameters', () => {
    const query = 'a&parent_id=42 + #中文'
    renderHook(() =>
      useFileManagement({
        currentFolderId: 7,
        searchQuery: query,
        sortField: 'name',
        sortDirection: 'asc',
        currentView: 'grid',
      })
    )
    const key = vi.mocked(useSWR).mock.calls[0]?.[0]
    expect(typeof key).toBe('string')
    const url = new URL(String(key), 'https://example.com')
    expect(url.searchParams.get('parent_id')).toBe('7')
    expect(url.searchParams.getAll('parent_id')).toHaveLength(1)
    expect(url.searchParams.get('search')).toBe(query)
  })
})
