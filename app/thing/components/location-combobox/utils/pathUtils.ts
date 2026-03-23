import type { Area, Room, Spot } from '@/app/thing/types'
import { buildLocationPathBySelection } from '@/lib/utils/location-path'

/**
 * 构建位置路径 - 使用共享工具库 (DRY & LongParameterList 修复)
 * @deprecated 请使用 @/lib/utils/location-path 中的 buildLocationPathBySelection
 */
export const buildLocationPath = (
  type: 'area' | 'room' | 'spot',
  id: number,
  areas: Area[],
  rooms: Room[],
  spots: Spot[],
  selectedAreaId: string,
  selectedRoomId: string
): string => {
  return buildLocationPathBySelection({
    type,
    id,
    areas,
    rooms,
    spots,
    selectedAreaId,
    selectedRoomId,
    separator: ' > ',
  })
}
