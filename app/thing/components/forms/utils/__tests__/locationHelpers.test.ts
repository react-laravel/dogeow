import { describe, expect, it, vi } from 'vitest'
import { updateLocationPath, handleLocationSelectLogic } from '../locationHelpers'
import type { Location, LocationType } from '../formConstants'
import type { LocationSelection } from '../../LocationComboboxSelectSimple'

const createArea = (id: number, name: string): Location => ({
  id,
  name,
  type: 'area',
  items_count: 0,
})

const createRoom = (id: number, name: string, areaId: number): Location => ({
  id,
  name,
  type: 'room',
  area_id: areaId,
  items_count: 0,
})

const createSpot = (id: number, name: string, roomId: number): Location => ({
  id,
  name,
  type: 'spot',
  room_id: roomId,
  items_count: 0,
})

describe('locationHelpers', () => {
  describe('updateLocationPath', () => {
    it('should return empty path and undefined selection when no IDs provided', () => {
      const result = updateLocationPath(undefined, undefined, undefined, [], [], [])
      expect(result.path).toBe('')
      expect(result.selectedLocation).toBeUndefined()
    })

    it('should return empty path when no IDs and no data', () => {
      const result = updateLocationPath('', '', '', [], [], [])
      expect(result.path).toBe('')
      expect(result.selectedLocation).toBeUndefined()
    })

    it('should build path with area only', () => {
      const areas = [createArea(1, '一楼')]
      const result = updateLocationPath('1', undefined, undefined, areas, [], [])
      expect(result.path).toBe('一楼')
      expect(result.selectedLocation).toEqual({ type: 'area', id: 1 })
    })

    it('should return empty when area not found', () => {
      const areas = [createArea(1, '一楼')]
      const result = updateLocationPath('99', undefined, undefined, areas, [], [])
      expect(result.path).toBe('')
      expect(result.selectedLocation).toBeUndefined()
    })

    it('should build path with area > room', () => {
      const areas = [createArea(1, '一楼')]
      const rooms = [createRoom(10, '客厅', 1)]
      const result = updateLocationPath('1', '10', undefined, areas, rooms, [])
      expect(result.path).toBe('一楼 > 客厅')
      expect(result.selectedLocation).toEqual({ type: 'room', id: 10 })
    })

    it('should build path with area > room > spot', () => {
      const areas = [createArea(1, '一楼')]
      const rooms = [createRoom(10, '客厅', 1)]
      const spots = [createSpot(100, '桌子', 10)]
      const result = updateLocationPath('1', '10', '100', areas, rooms, spots)
      expect(result.path).toBe('一楼 > 客厅 > 桌子')
      expect(result.selectedLocation).toEqual({ type: 'spot', id: 100 })
    })

    it('should handle missing room in path', () => {
      const areas = [createArea(1, '一楼')]
      const result = updateLocationPath('1', '99', undefined, areas, [], [])
      expect(result.path).toBe('一楼')
      expect(result.selectedLocation).toEqual({ type: 'area', id: 1 })
    })

    it('should handle missing spot in path', () => {
      const areas = [createArea(1, '一楼')]
      const rooms = [createRoom(10, '客厅', 1)]
      const result = updateLocationPath('1', '10', '999', areas, rooms, [])
      expect(result.path).toBe('一楼 > 客厅')
      expect(result.selectedLocation).toEqual({ type: 'room', id: 10 })
    })

    it('should handle string IDs correctly', () => {
      const areas = [createArea(1, '一楼')]
      const result = updateLocationPath('1', undefined, undefined, areas, [], [])
      expect(result.path).toBe('一楼')
    })

    it('should handle empty arrays gracefully', () => {
      const result = updateLocationPath('1', '10', '100', [], [], [])
      expect(result.path).toBe('')
      expect(result.selectedLocation).toBeUndefined()
    })
  })

  describe('handleLocationSelectLogic', () => {
    const mockSetCurrentValue = vi.fn()
    const mockLoadSpots = vi.fn()

    const defaultGetCurrentValue = (field: string) => {
      if (field === 'room_id') return '10'
      if (field === 'area_id') return '1'
      return ''
    }

    beforeEach(() => {
      mockSetCurrentValue.mockClear()
      mockLoadSpots.mockClear()
    })

    it('should clear all values when id is 0', async () => {
      await handleLocationSelectLogic(
        'area',
        0,
        '',
        [],
        [],
        defaultGetCurrentValue,
        mockSetCurrentValue,
        mockLoadSpots
      )

      expect(mockSetCurrentValue).toHaveBeenCalledWith('area_id', '')
      expect(mockSetCurrentValue).toHaveBeenCalledWith('room_id', '')
      expect(mockSetCurrentValue).toHaveBeenCalledWith('spot_id', '')
    })

    it('should clear all values when fullPath is empty', async () => {
      await handleLocationSelectLogic(
        'area',
        1,
        '',
        [],
        [],
        defaultGetCurrentValue,
        mockSetCurrentValue,
        mockLoadSpots
      )

      expect(mockSetCurrentValue).toHaveBeenCalledWith('area_id', '')
      expect(mockSetCurrentValue).toHaveBeenCalledWith('room_id', '')
      expect(mockSetCurrentValue).toHaveBeenCalledWith('spot_id', '')
    })

    it('should set area_id for area type', async () => {
      await handleLocationSelectLogic(
        'area',
        1,
        '一楼',
        [],
        [],
        defaultGetCurrentValue,
        mockSetCurrentValue,
        mockLoadSpots
      )

      expect(mockSetCurrentValue).toHaveBeenCalledWith('area_id', '1')
      expect(mockSetCurrentValue).toHaveBeenCalledWith('room_id', '')
      expect(mockSetCurrentValue).toHaveBeenCalledWith('spot_id', '')
    })

    it('should set room and area for room type', async () => {
      const rooms = [createRoom(10, '客厅', 1)]
      await handleLocationSelectLogic(
        'room',
        10,
        '一楼 > 客厅',
        rooms,
        [],
        defaultGetCurrentValue,
        mockSetCurrentValue,
        mockLoadSpots
      )

      expect(mockSetCurrentValue).toHaveBeenCalledWith('room_id', '10')
      expect(mockSetCurrentValue).toHaveBeenCalledWith('spot_id', '')
      expect(mockSetCurrentValue).toHaveBeenCalledWith('area_id', '1')
    })

    it('should set spot, room and area for spot type', async () => {
      const rooms = [createRoom(10, '客厅', 1)]
      const spots = [createSpot(100, '桌子', 10)]
      await handleLocationSelectLogic(
        'spot',
        100,
        '一楼 > 客厅 > 桌子',
        rooms,
        spots,
        defaultGetCurrentValue,
        mockSetCurrentValue,
        mockLoadSpots
      )

      expect(mockSetCurrentValue).toHaveBeenCalledWith('spot_id', '100')
      expect(mockSetCurrentValue).toHaveBeenCalledWith('room_id', '10')
      expect(mockSetCurrentValue).toHaveBeenCalledWith('area_id', '1')
    })

    it('should refresh spots when spot not found initially', async () => {
      const rooms = [createRoom(10, '客厅', 1)]
      const refreshedSpots = [createSpot(100, '新桌子', 10)]
      mockLoadSpots.mockResolvedValue(refreshedSpots)

      await handleLocationSelectLogic(
        'spot',
        100,
        '一楼 > 客厅 > 新桌子',
        rooms,
        [], // spots not found initially
        defaultGetCurrentValue,
        mockSetCurrentValue,
        mockLoadSpots
      )

      expect(mockLoadSpots).toHaveBeenCalledWith('10')
      expect(mockSetCurrentValue).toHaveBeenCalledWith('spot_id', '100')
    })
  })
})
