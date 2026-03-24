import { describe, it, expect } from 'vitest'
import { buildLocationPathFromSelection } from '@/lib/utils/location-path'
import type { Area, Room, Spot } from '@/app/thing/types'

describe('lib/utils/location-path - buildLocationPathFromSelection', () => {
  const areas: Area[] = [
    { id: 1, name: '客厅' },
    { id: 2, name: '卧室' },
  ]
  const rooms: Room[] = [
    { id: 11, name: '电视墙', area_id: 1 },
    { id: 22, name: '床边', area_id: 2 },
  ]
  const spots: Spot[] = [
    { id: 111, name: '抽屉', room_id: 11 },
    { id: 222, name: '床头柜', room_id: 22 },
  ]

  it('should build area path by area id', () => {
    expect(
      buildLocationPathFromSelection({ areaId: '1', roomId: '', spotId: '', areas, rooms, spots })
    ).toBe('客厅')
    expect(
      buildLocationPathFromSelection({ areaId: '999', roomId: '', spotId: '', areas, rooms, spots })
    ).toBe('')
  })

  it('should build room path when room and selected area exist', () => {
    expect(
      buildLocationPathFromSelection({ areaId: '1', roomId: '11', spotId: '', areas, rooms, spots })
    ).toBe('客厅 > 电视墙')
  })

  it('should return empty room path when room or area is missing', () => {
    expect(
      buildLocationPathFromSelection({ areaId: '', roomId: '11', spotId: '', areas, rooms, spots })
    ).toBe('')
    expect(
      buildLocationPathFromSelection({
        areaId: '1',
        roomId: '999',
        spotId: '',
        areas,
        rooms,
        spots,
      })
    ).toBe('')
  })

  it('should build spot path when spot, room and area exist', () => {
    expect(
      buildLocationPathFromSelection({
        areaId: '1',
        roomId: '11',
        spotId: '111',
        areas,
        rooms,
        spots,
      })
    ).toBe('客厅 > 电视墙 > 抽屉')
  })

  it('should return empty spot path when any level is missing', () => {
    expect(
      buildLocationPathFromSelection({
        areaId: '',
        roomId: '11',
        spotId: '111',
        areas,
        rooms,
        spots,
      })
    ).toBe('')
    expect(
      buildLocationPathFromSelection({
        areaId: '1',
        roomId: '',
        spotId: '111',
        areas,
        rooms,
        spots,
      })
    ).toBe('')
    expect(
      buildLocationPathFromSelection({
        areaId: '1',
        roomId: '11',
        spotId: '999',
        areas,
        rooms,
        spots,
      })
    ).toBe('')
  })
})
