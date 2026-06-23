import { describe, it, expect } from 'vitest'
import type { Area, Room, Spot } from '@/app/thing/types'
import {
  buildLocationPathById,
  buildLocationPathBySelection,
  buildLocationPath,
  buildLocationPathFromSelection,
  type LocationPathSelectionOptions,
} from '../location-path'

const mockAreaA: Area = { id: 1, name: 'Area A', created_at: '', updated_at: '' }
const mockAreaB: Area = { id: 2, name: 'Area B', created_at: '', updated_at: '' }
const mockRoom1: Room = { id: 10, name: 'Room 1', area_id: 1, created_at: '', updated_at: '' }
const mockRoom2: Room = { id: 20, name: 'Room 2', area_id: 2, created_at: '', updated_at: '' }
const mockSpot1: Spot = { id: 100, name: 'Spot 1', room_id: 10, created_at: '', updated_at: '' }
const mockSpot2: Spot = { id: 200, name: 'Spot 2', room_id: 20, created_at: '', updated_at: '' }

describe('location-path', () => {
  describe('buildLocationPathById', () => {
    it('should return area name for type area', () => {
      const result = buildLocationPathById('area', 1, {
        areas: [mockAreaA],
        rooms: [],
        spots: [],
      })
      expect(result).toBe('Area A')
    })

    it('should return translated unknown message when area not found', () => {
      const t = vi.fn((key: string) => `[${key}]`)
      const result = buildLocationPathById('area', 99, {
        areas: [mockAreaA],
        rooms: [],
        spots: [],
        t,
      })
      expect(t).toHaveBeenCalledWith('location.unknown_area')
      expect(result).toBe('[location.unknown_area]')
    })

    it('should return area > room path for type room', () => {
      const result = buildLocationPathById('room', 10, {
        areas: [mockAreaA, mockAreaB],
        rooms: [mockRoom1],
        spots: [],
      })
      expect(result).toBe('Area A > Room 1')
    })

    it('should use custom separator for room path', () => {
      const result = buildLocationPathById('room', 10, {
        areas: [mockAreaA],
        rooms: [mockRoom1],
        spots: [],
        separator: ' / ',
      })
      expect(result).toBe('Area A / Room 1')
    })

    it('should show unknown area fallback when room area not found', () => {
      const t = vi.fn((key: string) => `[${key}]`)
      const result = buildLocationPathById('room', 10, {
        areas: [],
        rooms: [mockRoom1],
        spots: [],
        t,
      })
      expect(result).toBe('[location.unknown_area] > Room 1')
    })

    it('should return area > room > spot path for type spot', () => {
      const result = buildLocationPathById('spot', 100, {
        areas: [mockAreaA],
        rooms: [mockRoom1],
        spots: [mockSpot1],
      })
      expect(result).toBe('Area A > Room 1 > Spot 1')
    })

    it('should handle spot with missing room', () => {
      const t = vi.fn((key: string) => `[${key}]`)
      const result = buildLocationPathById('spot', 100, {
        areas: [mockAreaA],
        rooms: [],
        spots: [mockSpot1],
        t,
      })
      expect(result).toBe('[location.unknown_room] > Spot 1')
    })

    it('should return empty string for missing spot', () => {
      const t = vi.fn((key: string) => `[${key}]`)
      const result = buildLocationPathById('spot', 999, {
        areas: [mockAreaA],
        rooms: [mockRoom1],
        spots: [mockSpot1],
        unknownSpotKey: 'location.unknown_spot',
        t,
      })
      expect(t).toHaveBeenCalledWith('location.unknown_spot')
    })
  })

  describe('buildLocationPathBySelection', () => {
    it('should return area name for type area', () => {
      const result = buildLocationPathBySelection({
        type: 'area',
        id: 1,
        areas: [mockAreaA],
        rooms: [],
        spots: [],
        selectedAreaId: '1',
        selectedRoomId: '',
      })
      expect(result).toBe('Area A')
    })

    it('should return empty string for unknown area', () => {
      const result = buildLocationPathBySelection({
        type: 'area',
        id: 99,
        areas: [mockAreaA],
        rooms: [],
        spots: [],
        selectedAreaId: '1',
        selectedRoomId: '',
      })
      expect(result).toBe('')
    })

    it('should return area > room for type room', () => {
      const result = buildLocationPathBySelection({
        type: 'room',
        id: 10,
        areas: [mockAreaA],
        rooms: [mockRoom1],
        spots: [],
        selectedAreaId: '1',
        selectedRoomId: '10',
      })
      expect(result).toBe('Area A > Room 1')
    })

    it('should return empty string for room when area not found by selectedAreaId', () => {
      const result = buildLocationPathBySelection({
        type: 'room',
        id: 10,
        areas: [mockAreaA],
        rooms: [mockRoom1],
        spots: [],
        selectedAreaId: '99',
        selectedRoomId: '10',
      })
      expect(result).toBe('')
    })

    it('should return area > room > spot for type spot', () => {
      const result = buildLocationPathBySelection({
        type: 'spot',
        id: 100,
        areas: [mockAreaA],
        rooms: [mockRoom1],
        spots: [mockSpot1],
        selectedAreaId: '1',
        selectedRoomId: '10',
      })
      expect(result).toBe('Area A > Room 1 > Spot 1')
    })

    it('should return empty string for spot when any selection is missing', () => {
      const result = buildLocationPathBySelection({
        type: 'spot',
        id: 100,
        areas: [],
        rooms: [],
        spots: [],
        selectedAreaId: '1',
        selectedRoomId: '10',
      })
      expect(result).toBe('')
    })
  })

  describe('buildLocationPath', () => {
    it('should join all provided parts with separator', () => {
      const result = buildLocationPath(mockAreaA, mockRoom1, mockSpot1)
      expect(result).toBe('Area A > Room 1 > Spot 1')
    })

    it('should handle undefined parts', () => {
      const result = buildLocationPath(mockAreaA, undefined, undefined)
      expect(result).toBe('Area A')
    })

    it('should use custom separator', () => {
      const result = buildLocationPath(mockAreaA, mockRoom1, mockSpot1, ' / ')
      expect(result).toBe('Area A / Room 1 / Spot 1')
    })

    it('should return empty string when all parts are undefined', () => {
      const result = buildLocationPath(undefined, undefined, undefined)
      expect(result).toBe('')
    })

    it('should skip undefined parts in the middle', () => {
      const result = buildLocationPath(mockAreaA, undefined, mockSpot1)
      expect(result).toBe('Area A > Spot 1')
    })
  })

  describe('buildLocationPathFromSelection', () => {
    it('should return empty string when areaId is empty', () => {
      const options: LocationPathSelectionOptions = {
        areaId: '',
        roomId: '10',
        spotId: '100',
        areas: [mockAreaA],
        rooms: [mockRoom1],
        spots: [mockSpot1],
      }
      expect(buildLocationPathFromSelection(options)).toBe('')
    })

    it('should return empty string when spotId is provided but roomId is empty', () => {
      const options: LocationPathSelectionOptions = {
        areaId: '1',
        roomId: '',
        spotId: '100',
        areas: [mockAreaA],
        rooms: [mockRoom1],
        spots: [mockSpot1],
      }
      expect(buildLocationPathFromSelection(options)).toBe('')
    })

    it('should return empty string when roomId is provided but room not found', () => {
      const options: LocationPathSelectionOptions = {
        areaId: '1',
        roomId: '99',
        spotId: '',
        areas: [mockAreaA],
        rooms: [mockRoom1],
        spots: [mockSpot1],
      }
      expect(buildLocationPathFromSelection(options)).toBe('')
    })

    it('should return empty string when spotId is provided but spot not found', () => {
      const options: LocationPathSelectionOptions = {
        areaId: '1',
        roomId: '10',
        spotId: '999',
        areas: [mockAreaA],
        rooms: [mockRoom1],
        spots: [mockSpot1],
      }
      expect(buildLocationPathFromSelection(options)).toBe('')
    })

    it('should build area only path', () => {
      const options: LocationPathSelectionOptions = {
        areaId: '1',
        roomId: '',
        spotId: '',
        areas: [mockAreaA],
        rooms: [],
        spots: [],
      }
      expect(buildLocationPathFromSelection(options)).toBe('Area A')
    })

    it('should build area > room path', () => {
      const options: LocationPathSelectionOptions = {
        areaId: '1',
        roomId: '10',
        spotId: '',
        areas: [mockAreaA],
        rooms: [mockRoom1],
        spots: [],
      }
      expect(buildLocationPathFromSelection(options)).toBe('Area A > Room 1')
    })

    it('should build area > room > spot path', () => {
      const options: LocationPathSelectionOptions = {
        areaId: '1',
        roomId: '10',
        spotId: '100',
        areas: [mockAreaA],
        rooms: [mockRoom1],
        spots: [mockSpot1],
      }
      expect(buildLocationPathFromSelection(options)).toBe('Area A > Room 1 > Spot 1')
    })

    it('should use custom separator', () => {
      const options: LocationPathSelectionOptions = {
        areaId: '1',
        roomId: '10',
        spotId: '',
        areas: [mockAreaA],
        rooms: [mockRoom1],
        spots: [],
        separator: ' | ',
      }
      expect(buildLocationPathFromSelection(options)).toBe('Area A | Room 1')
    })
  })
})
