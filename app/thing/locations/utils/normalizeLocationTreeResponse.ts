import type { Area, LocationTreeNode, LocationTreeResponse, Room, Spot } from '@/app/thing/types'

interface NormalizedLocationTreeData {
  areas: Area[]
  rooms: Room[]
  spots: Spot[]
}

const deriveAreasFromTree = (tree: LocationTreeNode[]): Area[] =>
  tree
    .filter(node => node.type === 'area')
    .map(node => ({
      id: node.original_id,
      name: node.name,
    }))

export function normalizeLocationTreeResponse(
  locationData?: Partial<LocationTreeResponse> | null
): NormalizedLocationTreeData {
  const tree = Array.isArray(locationData?.tree) ? locationData.tree : []
  const sourceAreas = Array.isArray(locationData?.areas) ? locationData.areas : []
  const sourceRooms = Array.isArray(locationData?.rooms) ? locationData.rooms : []
  const sourceSpots = Array.isArray(locationData?.spots) ? locationData.spots : []

  const areas = sourceAreas.length > 0 ? sourceAreas : deriveAreasFromTree(tree)
  const areaMap = new Map<number, Area>(areas.map(area => [area.id, area]))

  const rooms = sourceRooms.map(room => {
    const area = room.area ?? areaMap.get(room.area_id)
    return area ? { ...room, area } : room
  })

  const roomMap = new Map<number, Room>(rooms.map(room => [room.id, room]))

  const spots = sourceSpots.map(spot => {
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
