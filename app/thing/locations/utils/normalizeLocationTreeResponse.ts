import type { Area, LocationTreeNode, LocationTreeResponse, Room, Spot } from '@/app/thing/types'

interface NormalizedLocationTreeData {
  areas: Area[]
  rooms: Room[]
  spots: Spot[]
}

type RawArea = Area & {
  id: number | string
  user_id?: number | string
}

type RawRoom = Omit<Room, 'id' | 'area_id' | 'user_id' | 'area'> & {
  id: number | string
  area_id: number | string
  user_id?: number | string
  area?: RawArea
}

type RawSpot = Omit<Spot, 'id' | 'room_id' | 'user_id' | 'room'> & {
  id: number | string
  room_id: number | string
  user_id?: number | string
  room?: RawRoom
}

const normalizeNumber = (value: number | string): number =>
  typeof value === 'number' ? value : Number.parseInt(value, 10)

const normalizeOptionalNumber = (value: number | string | undefined): number | undefined => {
  if (value === undefined) {
    return undefined
  }

  return normalizeNumber(value)
}

const normalizeArea = (area: RawArea): Area => ({
  ...area,
  id: normalizeNumber(area.id),
  user_id: normalizeOptionalNumber(area.user_id),
})

const normalizeRoom = (room: RawRoom): Room => ({
  ...room,
  id: normalizeNumber(room.id),
  area_id: normalizeNumber(room.area_id),
  user_id: normalizeOptionalNumber(room.user_id),
  area: room.area ? normalizeArea(room.area) : undefined,
})

const normalizeSpot = (spot: RawSpot): Spot => ({
  ...spot,
  id: normalizeNumber(spot.id),
  room_id: normalizeNumber(spot.room_id),
  user_id: normalizeOptionalNumber(spot.user_id),
  room: spot.room ? normalizeRoom(spot.room) : undefined,
})

const deriveAreasFromTree = (tree: LocationTreeNode[]): Area[] =>
  tree
    .filter(node => node.type === 'area')
    .map(node => ({
      id: normalizeNumber(node.original_id),
      name: node.name,
    }))

export function normalizeLocationTreeResponse(
  locationData?: Partial<LocationTreeResponse> | null
): NormalizedLocationTreeData {
  const tree = Array.isArray(locationData?.tree) ? locationData.tree : []
  const sourceAreas = Array.isArray(locationData?.areas) ? (locationData.areas as RawArea[]) : []
  const sourceRooms = Array.isArray(locationData?.rooms) ? (locationData.rooms as RawRoom[]) : []
  const sourceSpots = Array.isArray(locationData?.spots) ? (locationData.spots as RawSpot[]) : []

  const areas = sourceAreas.length > 0 ? sourceAreas.map(normalizeArea) : deriveAreasFromTree(tree)
  const areaMap = new Map<number, Area>(areas.map(area => [area.id, area]))

  const rooms = sourceRooms.map(sourceRoom => {
    const room = normalizeRoom(sourceRoom)
    const area = room.area ?? areaMap.get(room.area_id)
    return area ? { ...room, area } : room
  })

  const roomMap = new Map<number, Room>(rooms.map(room => [room.id, room]))

  const spots = sourceSpots.map(sourceSpot => {
    const spot = normalizeSpot(sourceSpot)
    const room = spot.room ?? roomMap.get(spot.room_id)

    if (!room) {
      return spot
    }

    const area = room.area ?? areaMap.get(room.area_id)
    return area ? { ...spot, room: { ...room, area } } : { ...spot, room }
  })

  return {
    areas,
    rooms,
    spots,
  }
}
