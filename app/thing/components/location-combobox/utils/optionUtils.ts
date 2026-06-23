import type { Area, Room, Spot } from '@/app/thing/types'

/**
 * 生成区域选项
 */
export const getAreaOptions = (areas: Area[]) => [
  { value: '', label: '请选择区域' },
  ...areas.filter(Boolean).map(area => ({
    value: area.id.toString(),
    label: area.name,
  })),
]

/**
 * 生成房间选项
 */
export const getRoomOptions = (selectedAreaId: string, rooms: Room[]) => {
  if (!selectedAreaId) return []
  if (Number.isNaN(Number(selectedAreaId))) return [{ value: '', label: '请选择房间' }]

  return [
    { value: '', label: '请选择房间' },
    ...rooms.filter(Boolean).map(room => ({
      value: room.id.toString(),
      label: room.name,
    })),
  ]
}

/**
 * 生成位置选项
 */
export const getSpotOptions = (selectedRoomId: string, spots: Spot[]) => {
  if (!selectedRoomId) return []
  if (Number.isNaN(Number(selectedRoomId))) {
    return [{ value: '', label: '请选择具体位置' }]
  }

  return [
    { value: '', label: '请选择具体位置' },
    ...spots.filter(Boolean).map(spot => ({
      value: spot.id.toString(),
      label: spot.name,
    })),
  ]
}
