import type { Area, Room, Spot, LocationTreeResponse } from '@/app/thing/types'
import { buildLocationPathById } from '@/lib/utils/location-path'

/**
 * 构建位置路径 - 使用共享工具库 (DRY & LongParameterList 修复)
 * @deprecated 请使用 @/lib/utils/location-path 中的 buildLocationPathById
 */
export const buildPath = (
  type: 'area' | 'room' | 'spot',
  id: number,
  areas: LocationTreeResponse['areas'],
  rooms: Room[],
  spots: Spot[],
  t: (key: string, fallback?: string) => string
): string => {
  return buildLocationPathById(type, id, {
    areas,
    rooms,
    spots,
    separator: ' / ',
    t,
    unknownAreaKey: 'location.unknown_area',
    unknownRoomKey: 'location.unknown_room',
    unknownSpotKey: 'location.unknown_spot',
  })
}
