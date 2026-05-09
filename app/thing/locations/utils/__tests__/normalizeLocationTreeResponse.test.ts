import { describe, expect, it } from 'vitest'
import { normalizeLocationTreeResponse } from '../normalizeLocationTreeResponse'

describe('normalizeLocationTreeResponse', () => {
  it('backfills areas from tree data and hydrates room relationships', () => {
    const result = normalizeLocationTreeResponse({
      tree: [
        {
          id: 'area_1',
          name: '老家',
          type: 'area',
          original_id: 1,
          children: [],
          items_count: 0,
        },
      ],
      areas: [],
      rooms: [
        {
          id: 11,
          name: '卧室',
          area_id: 1,
        },
      ],
      spots: [
        {
          id: 101,
          name: '床头柜',
          room_id: 11,
        },
      ],
    })

    expect(result.areas).toEqual([
      expect.objectContaining({
        id: 1,
        name: '老家',
      }),
    ])
    expect(result.rooms[0].area).toEqual(
      expect.objectContaining({
        id: 1,
        name: '老家',
      })
    )
    expect(result.spots[0].room).toEqual(
      expect.objectContaining({
        id: 11,
        name: '卧室',
        area: expect.objectContaining({
          id: 1,
          name: '老家',
        }),
      })
    )
  })

  it('preserves existing nested relationships when the API already returns them', () => {
    const result = normalizeLocationTreeResponse({
      areas: [
        {
          id: 2,
          name: '老婆家',
          is_default: true,
        },
      ],
      rooms: [
        {
          id: 21,
          name: '书房',
          area_id: 2,
          area: {
            id: 2,
            name: '老婆家',
            is_default: true,
          },
        },
      ],
      spots: [
        {
          id: 201,
          name: '书桌',
          room_id: 21,
          room: {
            id: 21,
            name: '书房',
            area_id: 2,
            area: {
              id: 2,
              name: '老婆家',
              is_default: true,
            },
          },
        },
      ],
    })

    expect(result.areas[0]).toEqual(
      expect.objectContaining({
        id: 2,
        name: '老婆家',
        is_default: true,
      })
    )
    expect(result.rooms[0].area).toEqual(
      expect.objectContaining({
        id: 2,
        name: '老婆家',
        is_default: true,
      })
    )
    expect(result.spots[0].room?.area).toEqual(
      expect.objectContaining({
        id: 2,
        name: '老婆家',
        is_default: true,
      })
    )
  })
})
