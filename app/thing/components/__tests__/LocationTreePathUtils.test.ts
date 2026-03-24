import { describe, expect, it } from 'vitest'
import { buildLocationPathById } from '@/lib/utils/location-path'

const areas = [
  { id: 1, name: '客厅' },
  { id: 2, name: '卧室' },
]

const rooms = [
  { id: 11, name: '电视区', area_id: 1 },
  { id: 12, name: '主卧', area_id: 2 },
  { id: 13, name: '神秘房间', area_id: 999 },
]

const spots = [
  { id: 101, name: '沙发角落', room_id: 11 },
  { id: 102, name: '床头柜', room_id: 12 },
  { id: 103, name: '未知房间位置', room_id: 999 },
  { id: 104, name: '未知区域位置', room_id: 13 },
]

const t = (key: string) => key

describe('lib/utils/location-path - buildLocationPathById', () => {
  const defaultOptions = {
    areas,
    rooms,
    spots,
    separator: ' / ',
    t,
    unknownAreaKey: 'location.unknown_area',
    unknownRoomKey: 'location.unknown_room',
    unknownSpotKey: 'location.unknown_spot',
  }

  it('builds area and room paths with fallbacks', () => {
    expect(buildLocationPathById('area', 1, defaultOptions)).toBe('客厅')
    expect(buildLocationPathById('area', 999, defaultOptions)).toBe('location.unknown_area')
    expect(buildLocationPathById('room', 11, defaultOptions)).toBe('客厅 / 电视区')
    expect(buildLocationPathById('room', 13, defaultOptions)).toBe(
      'location.unknown_area / 神秘房间'
    )
    expect(buildLocationPathById('room', 999, defaultOptions)).toBe('location.unknown_room')
  })

  it('builds spot path for normal, unknown room, unknown area, and missing spot cases', () => {
    expect(buildLocationPathById('spot', 101, defaultOptions)).toBe('客厅 / 电视区 / 沙发角落')
    expect(buildLocationPathById('spot', 103, defaultOptions)).toBe(
      'location.unknown_room / 未知房间位置'
    )
    expect(buildLocationPathById('spot', 104, defaultOptions)).toBe(
      'location.unknown_area / 神秘房间 / 未知区域位置'
    )
    expect(buildLocationPathById('spot', 999, defaultOptions)).toBe('location.unknown_spot')
  })
})
