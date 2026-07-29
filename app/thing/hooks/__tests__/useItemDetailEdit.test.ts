import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Item } from '@/app/thing/types'
import { useItemDetailEdit } from '../useItemDetailEdit'

const mocks = vi.hoisted(() => ({
  cancelAutoSave: vi.fn(),
  fetchCategories: vi.fn(),
  fetchTags: vi.fn(),
  refreshAreas: vi.fn(),
  refreshRooms: vi.fn(),
  refreshSpots: vi.fn(),
  resetAutoSaveStatus: vi.fn(),
  setInitialData: vi.fn(),
  triggerAutoSave: vi.fn(),
  updateItem: vi.fn(),
}))

vi.mock('@/app/thing/stores/itemStore', () => ({
  useItemStore: () => ({
    categories: [],
    tags: [],
    fetchCategories: mocks.fetchCategories,
    fetchTags: mocks.fetchTags,
    updateItem: mocks.updateItem,
  }),
}))

vi.mock('@/app/thing/services/api', () => ({
  useAreas: () => ({ mutate: mocks.refreshAreas }),
  useRooms: () => ({ data: [], mutate: mocks.refreshRooms }),
  useSpots: () => ({ data: [], mutate: mocks.refreshSpots }),
}))

vi.mock('@/hooks/useAutoSave', () => ({
  useAutoSave: () => ({
    autoSaving: false,
    lastSaved: null,
    triggerAutoSave: mocks.triggerAutoSave,
    setInitialData: mocks.setInitialData,
    cancelAutoSave: mocks.cancelAutoSave,
    resetAutoSaveStatus: mocks.resetAutoSaveStatus,
  }),
}))

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

const item: Item = {
  id: 1,
  name: 'RC遥控车',
  description: null,
  quantity: 1,
  status: 'active',
  purchase_date: null,
  expiry_date: null,
  purchase_price: null,
  category_id: null,
  area_id: null,
  room_id: null,
  spot_id: null,
  is_public: false,
  created_at: '2026-07-29T00:00:00Z',
  updated_at: '2026-07-29T00:00:00Z',
  images: [],
  tags: [],
}

describe('useItemDetailEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fetchCategories.mockResolvedValue([])
    mocks.fetchTags.mockResolvedValue([])
    mocks.refreshAreas.mockResolvedValue(undefined)
  })

  it('does not auto-save hydrated item data before the user changes a field', async () => {
    const { result } = renderHook(() =>
      useItemDetailEdit({
        itemId: item.id,
        item,
        mode: 'edit',
        open: true,
      })
    )

    await waitFor(() => expect(mocks.setInitialData).toHaveBeenCalled())
    await waitFor(() => expect(result.current.editLoading).toBe(false))

    expect(result.current.formData.name).toBe('RC遥控车')
    expect(mocks.triggerAutoSave).not.toHaveBeenCalled()
    expect(mocks.updateItem).not.toHaveBeenCalled()

    act(() => {
      result.current.setFormData(current => ({
        ...current,
        name: 'RC遥控车 Pro',
      }))
    })

    await waitFor(() => expect(mocks.triggerAutoSave).toHaveBeenCalledTimes(1))
  })
})
