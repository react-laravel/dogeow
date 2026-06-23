import { describe, expect, it } from 'vitest'
import { getLocationPath } from '@/app/thing/utils'
import type { Spot } from '@/app/thing/types'

const createArea = (name: string) => ({ id: 1, name, user_id: 1 })
const createRoom = (name: string, areaName: string) => ({
  id: 1,
  name,
  area_id: 1,
  area: createArea(areaName),
  user_id: 1,
})
const createSpot = (name: string, roomName: string, areaName: string): Spot => ({
  id: 1,
  name,
  room_id: 1,
  room: createRoom(roomName, areaName),
  user_id: 1,
})

describe('getLocationPath', () => {
  it('should return "No location specified" when spot is undefined', () => {
    expect(getLocationPath(undefined)).toBe('No location specified')
  })

  it('should return "No location specified" when spot is null', () => {
    expect(getLocationPath(null)).toBe('No location specified')
  })

  it('should return "No location specified" when spot has no location data', () => {
    const emptySpot: Spot = {
      id: 1,
      name: '',
      room_id: 1,
      room: { id: 1, name: '', area_id: 1, area: { id: 1, name: '' } },
      user_id: 1,
    }
    expect(getLocationPath(emptySpot)).toBe('No location specified')
  })

  it('should build path with area > room > spot', () => {
    const spot = createSpot('桌子', '客厅', '一楼')
    expect(getLocationPath(spot)).toBe('一楼 > 客厅 > 桌子')
  })

  it('should build path with area > room when spot has no name', () => {
    const spot: Spot = {
      id: 1,
      name: '',
      room_id: 1,
      room: { id: 1, name: '卧室', area_id: 1, area: { id: 1, name: '二楼' } },
      user_id: 1,
    }
    expect(getLocationPath(spot)).toBe('二楼 > 卧室')
  })

  it('should build path with only spot name when room and area are missing', () => {
    const spot: Spot = {
      id: 1,
      name: '阳台',
      room_id: 1,
      room: { id: 1, name: '', area_id: 1, area: { id: 1, name: '' } },
      user_id: 1,
    }
    expect(getLocationPath(spot)).toBe('阳台')
  })

  it('should return "No location specified" when all names are empty', () => {
    const spot: Spot = {
      id: 1,
      name: '',
      room_id: 1,
      room: { id: 1, name: '', area_id: 1, area: { id: 1, name: '' } },
      user_id: 1,
    }
    expect(getLocationPath(spot)).toBe('No location specified')
  })

  it('should handle spot with area but no room name', () => {
    const spot: Spot = {
      id: 1,
      name: '角落',
      room_id: 1,
      room: { id: 1, name: '', area_id: 1, area: { id: 1, name: '地下室' } },
      user_id: 1,
    }
    expect(getLocationPath(spot)).toBe('地下室 > 角落')
  })
})
