import type { Area, Room, Spot } from '@/app/thing/types'

type LocationType = 'area' | 'room' | 'spot'
type Translate = (key: string) => string

export function buildPath(
  type: LocationType,
  id: number,
  areas: Array<Area | null | undefined>,
  rooms: Array<Room | null | undefined>,
  spots: Array<Spot | null | undefined>,
  t: Translate
): string {
  if (type === 'area') {
    return areas.find(area => area?.id === id)?.name ?? t('location.unknown_area')
  }

  if (type === 'room') {
    const room = rooms.find(item => item?.id === id)
    if (!room) return t('location.unknown_room')

    const area = areas.find(item => item?.id === room.area_id)
    return `${area?.name ?? t('location.unknown_area')} / ${room.name ?? t('location.unknown_room')}`
  }

  if (type === 'spot') {
    const spot = spots.find(item => item?.id === id)
    if (!spot) return t('location.unknown_spot')

    const room = rooms.find(item => item?.id === spot.room_id)
    if (!room) return `${t('location.unknown_room')} / ${spot.name ?? t('location.unknown_spot')}`

    const area = areas.find(item => item?.id === room.area_id)
    return `${area?.name ?? t('location.unknown_area')} / ${room.name ?? t('location.unknown_room')} / ${spot.name ?? t('location.unknown_spot')}`
  }

  return t('location.unknown_area')
}
