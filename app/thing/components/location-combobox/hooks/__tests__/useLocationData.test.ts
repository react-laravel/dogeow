import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useLocationData } from '../useLocationData'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

describe('useLocationData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiRequest).mockResolvedValue({ areas: [] })
  })

  it('should initialize with empty data', async () => {
    const { result } = renderHook(() => useLocationData())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.areas).toEqual([])
    expect(result.current.rooms).toEqual([])
    expect(result.current.spots).toEqual([])
  })

  it('should load areas successfully from { areas } payload', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ areas: [{ id: 1, name: '客厅' }] })

    const { result } = renderHook(() => useLocationData())

    await waitFor(() => {
      expect(result.current.areas).toEqual([{ id: 1, name: '客厅' }])
    })

    expect(apiRequest).toHaveBeenCalledWith('/areas')
  })

  it('should handle load areas failure', async () => {
    vi.mocked(apiRequest).mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useLocationData())

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('加载区域失败')
    })

    expect(result.current.loading).toBe(false)
  })

  it('should clear rooms when areaId is empty', async () => {
    const { result } = renderHook(() => useLocationData())

    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.setRooms([{ id: 11, name: '主客厅', area_id: 1 }] as never)
    })

    await act(async () => {
      await result.current.loadRooms('')
    })

    expect(result.current.rooms).toEqual([])
  })

  it('should load rooms successfully from { rooms } payload', async () => {
    const { result } = renderHook(() => useLocationData())
    await waitFor(() => expect(result.current.loading).toBe(false))

    vi.mocked(apiRequest).mockResolvedValueOnce({
      rooms: [{ id: 11, name: '主客厅', area_id: 1 }],
    })

    await act(async () => {
      await result.current.loadRooms('1')
    })

    expect(apiRequest).toHaveBeenCalledWith('/areas/1/rooms')
    expect(result.current.rooms).toEqual([{ id: 11, name: '主客厅', area_id: 1 }])
  })

  it('should handle load rooms failure', async () => {
    const { result } = renderHook(() => useLocationData())
    await waitFor(() => expect(result.current.loading).toBe(false))

    vi.mocked(apiRequest).mockRejectedValueOnce(new Error('network error'))

    await act(async () => {
      await result.current.loadRooms('1')
    })

    expect(toast.error).toHaveBeenCalledWith('加载房间失败')
  })

  it('should clear spots when roomId is empty', async () => {
    const { result } = renderHook(() => useLocationData())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.setSpots([{ id: 111, name: '沙发', room_id: 11 }] as never)
    })

    await act(async () => {
      await result.current.loadSpots('')
    })

    expect(result.current.spots).toEqual([])
  })

  it('should load spots successfully from { spots } payload', async () => {
    const { result } = renderHook(() => useLocationData())
    await waitFor(() => expect(result.current.loading).toBe(false))

    vi.mocked(apiRequest).mockResolvedValueOnce({
      spots: [{ id: 111, name: '沙发', room_id: 11 }],
    })

    await act(async () => {
      await result.current.loadSpots('11')
    })

    expect(apiRequest).toHaveBeenCalledWith('/rooms/11/spots')
    expect(result.current.spots).toEqual([{ id: 111, name: '沙发', room_id: 11 }])
  })

  it('should handle load spots failure', async () => {
    const { result } = renderHook(() => useLocationData())
    await waitFor(() => expect(result.current.loading).toBe(false))

    vi.mocked(apiRequest).mockRejectedValueOnce(new Error('network error'))

    await act(async () => {
      await result.current.loadSpots('11')
    })

    expect(toast.error).toHaveBeenCalledWith('加载位置失败')
  })
})
