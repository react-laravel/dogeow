import type { Area, Room, Spot } from '@/app/thing/types'

export interface SelectOption {
  value: string
  label: string
}

const DEFAULT_PLACEHOLDER = {
  area: '请选择区域',
  room: '请选择房间',
  spot: '请选择具体位置',
}

/**
 * Convert areas to select options with placeholder
 */
export function areaToOptions(areas: Area[]): SelectOption[] {
  if (!Array.isArray(areas)) {
    return [{ value: '', label: DEFAULT_PLACEHOLDER.area }]
  }
  return [
    { value: '', label: DEFAULT_PLACEHOLDER.area },
    ...areas.map(area => ({
      value: area.id.toString(),
      label: area.name,
    })),
  ]
}

/**
 * Convert rooms to select options with placeholder
 */
export function roomToOptions(rooms: Room[]): SelectOption[] {
  if (!Array.isArray(rooms)) {
    return [{ value: '', label: DEFAULT_PLACEHOLDER.room }]
  }
  return [
    { value: '', label: DEFAULT_PLACEHOLDER.room },
    ...rooms.map(room => ({
      value: room.id.toString(),
      label: room.name,
    })),
  ]
}

/**
 * Convert spots to select options with placeholder
 */
export function spotToOptions(spots: Spot[]): SelectOption[] {
  if (!Array.isArray(spots)) {
    return [{ value: '', label: DEFAULT_PLACEHOLDER.spot }]
  }
  return [
    { value: '', label: DEFAULT_PLACEHOLDER.spot },
    ...spots.map(spot => ({
      value: spot.id.toString(),
      label: spot.name,
    })),
  ]
}
