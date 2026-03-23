import type { Area, Room, Spot } from '@/app/thing/types'
import {
  buildLocationPath as buildLocationPathFromObjects,
  buildLocationPathFromSelection,
} from '@/lib/utils/location-path'

/**
 * 构建位置路径字符串 - 使用共享工具库 (DRY & LongParameterList 修复)
 * @deprecated 请使用 @/lib/utils/location-path 中的 buildLocationPath
 */
export const buildLocationPath = (
  area: Area | undefined,
  room: Room | undefined,
  spot: Spot | undefined
): string => {
  return buildLocationPathFromObjects(area, room, spot, ' > ')
}

/**
 * 根据选择构建路径 - 使用共享工具库 (DRY & LongParameterList 修复)
 * @deprecated 请使用 @/lib/utils/location-path 中的 buildLocationPathFromSelection
 */
export const buildPathFromSelection = (
  areaId: string,
  roomId: string,
  spotId: string,
  areas: Area[],
  rooms: Room[],
  spots: Spot[]
): string => {
  return buildLocationPathFromSelection({
    areaId,
    roomId,
    spotId,
    areas,
    rooms,
    spots,
    separator: ' > ',
  })
}
