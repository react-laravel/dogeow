import { describe, it, expect } from 'vitest'
import type { Area, Room, Spot } from '@/app/thing/types'
import { areaToOptions, roomToOptions, spotToOptions, SelectOption } from '../location-options'

const mockArea: Area = { id: 1, name: 'Living Room', created_at: '', updated_at: '' }
const mockArea2: Area = { id: 2, name: 'Kitchen', created_at: '', updated_at: '' }
const mockRoom: Room = { id: 10, name: 'Room A', area_id: 1, created_at: '', updated_at: '' }
const mockSpot: Spot = { id: 100, name: 'Shelf', room_id: 10, created_at: '', updated_at: '' }

describe('location-options', () => {
  describe('areaToOptions', () => {
    it('should include a placeholder option as the first element', () => {
      const options = areaToOptions([mockArea])
      expect(options[0]).toEqual({ value: '', label: '请选择区域' })
    })

    it('should convert areas to options with id as string value', () => {
      const options = areaToOptions([mockArea, mockArea2])
      expect(options).toHaveLength(3)
      expect(options[1]).toEqual({ value: '1', label: 'Living Room' })
      expect(options[2]).toEqual({ value: '2', label: 'Kitchen' })
    })

    it('should return only placeholder for empty array', () => {
      const options = areaToOptions([])
      expect(options).toEqual([{ value: '', label: '请选择区域' }])
    })

    it('should return only placeholder for non-array input', () => {
      const options = areaToOptions(null as unknown as Area[])
      expect(options).toEqual([{ value: '', label: '请选择区域' }])

      const options2 = areaToOptions(undefined as unknown as Area[])
      expect(options2).toEqual([{ value: '', label: '请选择区域' }])
    })

    it('should return only placeholder when areas is a string', () => {
      const options = areaToOptions('not-an-array' as unknown as Area[])
      expect(options).toEqual([{ value: '', label: '请选择区域' }])
    })
  })

  describe('roomToOptions', () => {
    it('should include a placeholder option as the first element', () => {
      const options = roomToOptions([mockRoom])
      expect(options[0]).toEqual({ value: '', label: '请选择房间' })
    })

    it('should convert rooms to options with id as string value', () => {
      const options = roomToOptions([mockRoom])
      expect(options).toHaveLength(2)
      expect(options[1]).toEqual({ value: '10', label: 'Room A' })
    })

    it('should return only placeholder for empty array', () => {
      const options = roomToOptions([])
      expect(options).toEqual([{ value: '', label: '请选择房间' }])
    })

    it('should return only placeholder for non-array input', () => {
      const options = roomToOptions(null as unknown as Room[])
      expect(options).toEqual([{ value: '', label: '请选择房间' }])
    })
  })

  describe('spotToOptions', () => {
    it('should include a placeholder option as the first element', () => {
      const options = spotToOptions([mockSpot])
      expect(options[0]).toEqual({ value: '', label: '请选择具体位置' })
    })

    it('should convert spots to options with id as string value', () => {
      const options = spotToOptions([mockSpot])
      expect(options).toHaveLength(2)
      expect(options[1]).toEqual({ value: '100', label: 'Shelf' })
    })

    it('should return only placeholder for empty array', () => {
      const options = spotToOptions([])
      expect(options).toEqual([{ value: '', label: '请选择具体位置' }])
    })

    it('should return only placeholder for non-array input', () => {
      const options = spotToOptions(undefined as unknown as Spot[])
      expect(options).toEqual([{ value: '', label: '请选择具体位置' }])
    })
  })
})
