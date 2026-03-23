import { describe, expect, it } from 'vitest'
import { getAreaOptions, getRoomOptions, getSpotOptions } from '../optionUtils'

const areas = [
  { id: 1, name: '客厅' },
  { id: 2, name: '卧室' },
] as any

const rooms = [
  { id: 11, name: '电视区', area_id: 1 },
  { id: 22, name: '主卧', area_id: 2 },
] as any

const spots = [
  { id: 101, name: '沙发角落', room_id: 11 },
  { id: 202, name: '床头柜', room_id: 22 },
] as any

describe('location-combobox optionUtils', () => {
  it('getAreaOptions prepends placeholder and maps id/name', () => {
    expect(getAreaOptions(areas)).toEqual([
      { value: '', label: '请选择区域' },
      { value: '1', label: '客厅' },
      { value: '2', label: '卧室' },
    ])
  })

  it('getRoomOptions returns empty list when selectedAreaId is empty', () => {
    expect(getRoomOptions('', rooms)).toEqual([])
  })

  it('getRoomOptions prepends placeholder and maps room options', () => {
    expect(getRoomOptions('1', rooms)).toEqual([
      { value: '', label: '请选择房间' },
      { value: '11', label: '电视区' },
      { value: '22', label: '主卧' },
    ])
  })

  it('getSpotOptions returns empty list when selectedRoomId is empty', () => {
    expect(getSpotOptions('', spots)).toEqual([])
  })

  it('getSpotOptions prepends placeholder and maps spot options', () => {
    expect(getSpotOptions('11', spots)).toEqual([
      { value: '', label: '请选择具体位置' },
      { value: '101', label: '沙发角落' },
      { value: '202', label: '床头柜' },
    ])
  })

  it('handles empty arrays', () => {
    expect(getAreaOptions([])).toEqual([{ value: '', label: '请选择区域' }])
    expect(getRoomOptions('1', [])).toEqual([{ value: '', label: '请选择房间' }])
    expect(getSpotOptions('11', [])).toEqual([{ value: '', label: '请选择具体位置' }])
  })

  it('handles undefined/null values in arrays', () => {
    const areasWithNull = [{ id: 1, name: '客厅' }, undefined] as any
    expect(getAreaOptions(areasWithNull)).toEqual([
      { value: '', label: '请选择区域' },
      { value: '1', label: '客厅' },
    ])

    const roomsWithNull = [{ id: 11, name: '电视区', area_id: 1 }, null] as any
    expect(getRoomOptions('1', roomsWithNull)).toEqual([
      { value: '', label: '请选择房间' },
      { value: '11', label: '电视区' },
    ])
  })

  it('handles area name as null or undefined', () => {
    const areasWithNullName = [{ id: 1, name: null }, { id: 2, name: '卧室' }] as any
    expect(getAreaOptions(areasWithNullName)).toEqual([
      { value: '', label: '请选择区域' },
      { value: '1', label: null },
      { value: '2', label: '卧室' },
    ])

    const areasWithUndefinedName = [{ id: 1, name: undefined }, { id: 2, name: '卧室' }] as any
    expect(getAreaOptions(areasWithUndefinedName)).toEqual([
      { value: '', label: '请选择区域' },
      { value: '1', label: undefined },
      { value: '2', label: '卧室' },
    ])
  })

  it('handles string vs number id types', () => {
    const areasWithStringId = [{ id: '1', name: '客厅' }, { id: '2', name: '卧室' }] as any
    expect(getAreaOptions(areasWithStringId)).toEqual([
      { value: '', label: '请选择区域' },
      { value: '1', label: '客厅' },
      { value: '2', label: '卧室' },
    ])
  })

  it('getRoomOptions returns empty for non-numeric selectedAreaId', () => {
    expect(getRoomOptions('abc', rooms)).toEqual([{ value: '', label: '请选择房间' }])
  })

  it('getSpotOptions returns empty for non-numeric selectedRoomId', () => {
    expect(getSpotOptions('abc', spots)).toEqual([{ value: '', label: '请选择具体位置' }])
  })
})
