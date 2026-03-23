import { describe, expect, it } from 'vitest'
import { buildPath } from '../pathUtils'

const areas = [
  { id: 1, name: '客厅' },
  { id: 2, name: '卧室' },
]

const rooms = [
  { id: 11, name: '电视区', area_id: 1 },
  { id: 12, name: '主卧', area_id: 2 },
  { id: 13, name: '阁楼', area_id: 999 },
]

const spots = [
  { id: 101, name: '沙发角落', room_id: 11 },
  { id: 102, name: '床头柜', room_id: 12 },
  { id: 103, name: '未知房间位置', room_id: 998 },
  { id: 104, name: '未知区域位置', room_id: 13 },
]

const t = (key: string) => key

describe('pathUtils', () => {
  it('builds area path and unknown-area fallback', () => {
    expect(buildPath('area', 1, areas, rooms, spots, t)).toBe('客厅')
    expect(buildPath('area', 999, areas, rooms, spots, t)).toBe('location.unknown_area')
  })

  it('builds room path and unknown-room fallback', () => {
    expect(buildPath('room', 11, areas, rooms, spots, t)).toBe('客厅 / 电视区')
    expect(buildPath('room', 999, areas, rooms, spots, t)).toBe('location.unknown_room')
  })

  it('builds room path with unknown area fallback', () => {
    expect(buildPath('room', 13, areas, rooms, spots, t)).toBe('location.unknown_area / 阁楼')
  })

  it('builds spot path including area and room', () => {
    expect(buildPath('spot', 101, areas, rooms, spots, t)).toBe('客厅 / 电视区 / 沙发角落')
  })

  it('builds spot path with unknown room fallback', () => {
    expect(buildPath('spot', 103, areas, rooms, spots, t)).toBe(
      'location.unknown_room / 未知房间位置'
    )
  })

  it('builds spot path with unknown area fallback when room exists', () => {
    expect(buildPath('spot', 104, areas, rooms, spots, t)).toBe(
      'location.unknown_area / 阁楼 / 未知区域位置'
    )
  })

  it('returns unknown spot fallback when spot does not exist', () => {
    expect(buildPath('spot', 999, areas, rooms, spots, t)).toBe('location.unknown_spot')
  })

  it('handles empty arrays', () => {
    expect(buildPath('area', 1, [], [], [], t)).toBe('location.unknown_area')
    expect(buildPath('room', 11, areas, [], [], t)).toBe('location.unknown_room')
    expect(buildPath('spot', 101, areas, rooms, [], t)).toBe('location.unknown_spot')
  })

  it('handles area with null or undefined name', () => {
    const areasWithNull = [{ id: 1, name: null }, { id: 2, name: '卧室' }] as any
    expect(buildPath('area', 1, areasWithNull, rooms, spots, t)).toBe('location.unknown_area')
    expect(buildPath('area', 2, areasWithNull, rooms, spots, t)).toBe('卧室')
  })

  it('handles room with null or undefined name', () => {
    const roomsWithNull = [
      { id: 11, name: null, area_id: 1 },
      { id: 12, name: '主卧', area_id: 2 },
    ] as any
    expect(buildPath('room', 11, areas, roomsWithNull, spots, t)).toBe('客厅 / location.unknown_room')
  })

  it('handles spot with null or undefined name', () => {
    const spotsWithNull = [
      { id: 101, name: null, room_id: 11 },
      { id: 102, name: '床头柜', room_id: 12 },
    ] as any
    expect(buildPath('spot', 101, areas, rooms, spotsWithNull, t)).toBe(
      '客厅 / 电视区 / location.unknown_spot'
    )
  })

  it('handles undefined/null values in arrays', () => {
    const areasWithUndefined = [{ id: 1, name: '客厅' }, undefined] as any
    expect(buildPath('area', 1, areasWithUndefined, rooms, spots, t)).toBe('客厅')
  })

  it('handles unknown type value', () => {
    expect(buildPath('unknown' as any, 1, areas, rooms, spots, t)).toBe('location.unknown_area')
  })
})
