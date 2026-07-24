import { useState, useCallback, useEffect, startTransition } from 'react'
import { apiRequest } from '@/lib/api'
import type { Location } from '../formConstants'

function unwrapList<T>(payload: unknown, key: string): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === 'object' && key in payload) {
    const value = (payload as Record<string, unknown>)[key]
    return Array.isArray(value) ? (value as T[]) : []
  }
  return []
}

export function useLocationData(isCreateMode: boolean) {
  const [areas, setAreas] = useState<Location[]>([])
  const [rooms, setRooms] = useState<Location[]>([])
  const [spots, setSpots] = useState<Location[]>([])

  const loadAreas = useCallback(async () => {
    if (!isCreateMode) return []
    try {
      const data = await apiRequest<unknown>('/areas')
      const list = unwrapList<Location>(data, 'areas')
      setAreas(list)
      return list
    } catch (error) {
      console.error('加载区域失败', error)
      return []
    }
  }, [isCreateMode])

  const loadRooms = useCallback(
    async (areaId: string) => {
      if (!isCreateMode || !areaId) {
        setRooms([])
        return []
      }

      try {
        const data = await apiRequest<unknown>(`/areas/${areaId}/rooms`)
        const list = unwrapList<Location>(data, 'rooms')
        setRooms(list)
        return list
      } catch (error) {
        console.error('加载房间失败', error)
        return []
      }
    },
    [isCreateMode]
  )

  const loadSpots = useCallback(
    async (roomId: string) => {
      if (!isCreateMode || !roomId) {
        setSpots([])
        return []
      }

      try {
        const data = await apiRequest<unknown>(`/rooms/${roomId}/spots`)
        const list = unwrapList<Location>(data, 'spots')
        setSpots(list)
        return list
      } catch (error) {
        console.error('加载位置失败', error)
        return []
      }
    },
    [isCreateMode]
  )

  useEffect(() => {
    if (isCreateMode) {
      startTransition(() => {
        void loadAreas()
      })
    }
  }, [isCreateMode, loadAreas])

  return {
    areas,
    rooms,
    spots,
    loadAreas,
    loadRooms,
    loadSpots,
  }
}
