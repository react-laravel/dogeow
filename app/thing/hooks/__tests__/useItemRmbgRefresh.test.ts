import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { itemHasPendingRmbg, useItemRmbgRefresh } from '../useItemRmbgRefresh'
import type { Item } from '../../types'

describe('useItemRmbgRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('itemHasPendingRmbg detects pending images', () => {
    const item = {
      id: 1,
      images: [{ id: 1, path: 'items/1/a.jpg', thumbnail_path: '', rmbg_status: 'pending' }],
    } as Item

    expect(itemHasPendingRmbg(item)).toBe(true)
  })

  it('polls refresh while rmbg is pending', async () => {
    const refreshItem = vi.fn().mockResolvedValue(undefined)
    const item = {
      id: 1,
      images: [{ id: 1, path: 'items/1/a.jpg', thumbnail_path: '', rmbg_status: 'processing' }],
    } as Item

    renderHook(() => useItemRmbgRefresh(item, refreshItem))

    vi.advanceTimersByTime(2000)

    await waitFor(() => {
      expect(refreshItem).toHaveBeenCalledTimes(1)
    })
  })
})
