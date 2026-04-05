import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/api'
import type { Area, Room, Spot } from '@/app/thing/types'

/**
 * Shared hook for managing location data (areas, rooms, spots)
 * DRY solution - consolidated from duplicated location/location-combobox hooks
 */
export function useLocationData() {
  const [areas, setAreas] = useState<Area[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [spots, setSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(false)

  const loadAreas = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiRequest<{ areas: Area[] }>('/areas')
      const areasData = Array.isArray(response) ? response : (response?.areas ?? [])
      setAreas(Array.isArray(areasData) ? areasData : [])
    } catch (error) {
      console.error('加载区域失败:', error)
      toast.error('加载区域失败')
      setAreas([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadRooms = useCallback(async (areaId: string) => {
    if (!areaId) {
      setRooms([])
      return
    }

    try {
      const response = await apiRequest<{ rooms: Room[] }>(`/areas/${areaId}/rooms`)
      const roomsData = Array.isArray(response) ? response : (response?.rooms ?? [])
      setRooms(Array.isArray(roomsData) ? roomsData : [])
    } catch (error) {
      console.error('加载房间失败:', error)
      toast.error('加载房间失败')
      setRooms([])
    }
  }, [])

  const loadSpots = useCallback(async (roomId: string) => {
    if (!roomId) {
      setSpots([])
      return
    }

    try {
      const response = await apiRequest<{ spots: Spot[] }>(`/rooms/${roomId}/spots`)
      const spotsData = Array.isArray(response) ? response : (response?.spots ?? [])
      setSpots(Array.isArray(spotsData) ? spotsData : [])
    } catch (error) {
      console.error('加载位置失败:', error)
      toast.error('加载位置失败')
      setSpots([])
    }
  }, [])

  // Auto-load areas on mount
  useEffect(() => {
    loadAreas()
  }, [loadAreas])

  return {
    areas,
    rooms,
    spots,
    loading,
    setAreas,
    setRooms,
    setSpots,
    loadAreas,
    loadRooms,
    loadSpots,
  }
}
