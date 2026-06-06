import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { itemHasPendingRmbg, useItemRmbgRefresh } from '../useItemRmbgRefresh'
import type { Item } from '../../types'

const { subscribeRmbgStatusUpdatesMock } = vi.hoisted(() => ({
  subscribeRmbgStatusUpdatesMock: vi.fn(),
}))

vi.mock('@/stores/authStore', () => ({
  default: (selector: (state: { user?: { id: number } }) => unknown) =>
    selector({ user: { id: 1 } }),
}))

vi.mock('../../utils/rmbg', () => ({
  subscribeRmbgStatusUpdates: subscribeRmbgStatusUpdatesMock,
}))

describe('useItemRmbgRefresh', () => {
  beforeEach(() => {
    subscribeRmbgStatusUpdatesMock.mockReset()
    subscribeRmbgStatusUpdatesMock.mockReturnValue(() => {})
  })

  it('itemHasPendingRmbg detects pending images', () => {
    const item = {
      id: 1,
      images: [{ id: 1, path: 'items/1/a.jpg', thumbnail_path: '', rmbg_status: 'pending' }],
    } as Item

    expect(itemHasPendingRmbg(item)).toBe(true)
  })

  it('subscribes to websocket updates while rmbg is pending', () => {
    const refreshItem = vi.fn().mockResolvedValue(undefined)
    const item = {
      id: 9,
      images: [{ id: 1, path: 'items/9/a.jpg', thumbnail_path: '', rmbg_status: 'processing' }],
    } as Item

    renderHook(() => useItemRmbgRefresh(item, refreshItem))

    expect(subscribeRmbgStatusUpdatesMock).toHaveBeenCalledWith(1, expect.any(Function))
  })
})
