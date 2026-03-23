import type { Area, Room, Spot } from '@/app/thing/types'

/**
 * Location path build options - fixes LongParameterList by encapsulating parameters
 */
export interface LocationPathOptions {
  areas: Area[]
  rooms: Room[]
  spots: Spot[]
  /** Separator between path parts, defaults to " > " */
  separator?: string
  /** I18n translate function for fallback messages */
  t?: (key: string, fallback?: string) => string
  /** Unknown area fallback key, defaults to "location.unknown_area" */
  unknownAreaKey?: string
  /** Unknown room fallback key, defaults to "location.unknown_room" */
  unknownRoomKey?: string
  /** Unknown spot fallback key, defaults to "location.unknown_spot" */
  unknownSpotKey?: string
}

/**
 * Build location path by type and id - consolidated DRY solution
 */
export function buildLocationPathById(
  type: 'area' | 'room' | 'spot',
  id: number,
  options: LocationPathOptions
): string {
  const {
    areas,
    rooms,
    spots,
    separator = ' > ',
    t = (key: string) => key,
    unknownAreaKey = 'location.unknown_area',
    unknownRoomKey = 'location.unknown_room',
    unknownSpotKey = 'location.unknown_spot',
  } = options

  const pathParts: string[] = []

  if (type === 'area') {
    const area = areas.find(a => a.id === id)
    return area?.name || (t !== undefined ? t(unknownAreaKey) : '')
  }

  if (type === 'room') {
    const room = rooms.find(r => r.id === id)
    if (!room) return t(unknownRoomKey)

    const area = areas.find(a => a.id === room.area_id)
    pathParts.push(area?.name || t(unknownAreaKey), room.name)
    return pathParts.join(separator)
  }

  // spot
  const spot = spots.find(s => s.id === id)
  if (!spot) return t(unknownSpotKey)

  const room = rooms.find(r => r.id === spot.room_id)
  if (!room) {
    pathParts.push(t(unknownRoomKey), spot.name)
  } else {
    const area = areas.find(a => a.id === room.area_id)
    pathParts.push(area?.name || t(unknownAreaKey), room.name, spot.name)
  }

  return pathParts.join(separator)
}

/**
 * Build location path by type and id with selected IDs - for combobox use case
 * This uses selectedAreaId/selectedRoomId to find the area/room instead of the parent_id
 */
export interface LocationPathBySelectionOptions {
  type: 'area' | 'room' | 'spot'
  id: number
  areas: Area[]
  rooms: Room[]
  spots: Spot[]
  selectedAreaId: string
  selectedRoomId: string
  separator?: string
}

export function buildLocationPathBySelection(options: LocationPathBySelectionOptions): string {
  const {
    type,
    id,
    areas,
    rooms,
    spots,
    selectedAreaId,
    selectedRoomId,
    separator = ' > ',
  } = options

  if (type === 'area') {
    const area = areas.find(a => a.id === id)
    return area?.name ?? ''
  }

  if (type === 'room') {
    const room = rooms.find(r => r.id === id)
    const area = areas.find(a => a.id.toString() === selectedAreaId)
    if (room && area) {
      return `${area.name} > ${room.name}`
    }
    return ''
  }

  // spot
  const spot = spots.find(s => s.id === id)
  const room = rooms.find(r => r.id.toString() === selectedRoomId)
  const area = areas.find(a => a.id.toString() === selectedAreaId)
  if (spot && room && area) {
    return `${area.name} > ${room.name} > ${spot.name}`
  }
  return ''
}

/**
 * Build location path from actual objects (not ids) - simple case
 */
export function buildLocationPath(
  area: Area | undefined,
  room: Room | undefined,
  spot: Spot | undefined,
  separator = ' > '
): string {
  const parts: string[] = []
  if (area) parts.push(area.name)
  if (room) parts.push(room.name)
  if (spot) parts.push(spot.name)
  return parts.join(separator)
}

/**
 * Build location path from selection ids - fixes LongParameterList
 */
export interface LocationPathSelectionOptions {
  areaId: string
  roomId: string
  spotId: string
  areas: Area[]
  rooms: Room[]
  spots: Spot[]
  separator?: string
}

export function buildLocationPathFromSelection(options: LocationPathSelectionOptions): string {
  const { areaId, roomId, spotId, areas, rooms, spots, separator = ' > ' } = options

  const area = areas.find(a => a.id.toString() === areaId)
  const room = rooms.find(r => r.id.toString() === roomId)
  const spot = spots.find(s => s.id.toString() === spotId)

  return buildLocationPath(area, room, spot, separator)
}
