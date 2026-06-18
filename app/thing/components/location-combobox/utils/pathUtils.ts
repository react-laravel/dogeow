import type { Area, Room, Spot } from '@/app/thing/types'

type LocationType = 'area' | 'room' | 'spot'

export function buildLocationPath(
  type: LocationType,
  id: number,
  areas: Array<Area | null | undefined>,
  rooms: Array<Room | null | undefined>,
  spots: Array<Spot | null | undefined>,
  selectedAreaId: string,
  selectedRoomId: string
): string {
  if (type === 'area') {
    return areas.find(area => area?.id === id)?.name ?? ''
  }

  if (type === 'room') {
    const room = rooms.find(item => item?.id === id)
    const area = areas.find(item => item?.id.toString() === selectedAreaId)
    return room?.name && area?.name ? `${area.name} > ${room.name}` : ''
  }

  const spot = spots.find(item => item?.id === id)
  const room = rooms.find(item => item?.id.toString() === selectedRoomId)
  const area = areas.find(item => item?.id.toString() === selectedAreaId)

  return spot?.name && room?.name && area?.name ? `${area.name} > ${room.name} > ${spot.name}` : ''
}
