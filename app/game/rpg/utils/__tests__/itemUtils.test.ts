import { describe, expect, it } from 'vitest'
import { formatItemStatValue, getItemTotalStats } from '../itemUtils'
import type { GameItem } from '../../types'

describe('itemUtils', () => {
  it('returns gem_stats for gem items', () => {
    const gem: GameItem = {
      id: 1,
      character_id: 1,
      definition_id: 147,
      definition: {
        id: 147,
        name: '防御宝石',
        type: 'gem',
        base_stats: {},
        gem_stats: { defense: 8 },
        required_level: 1,
      },
      quality: 'common',
      stats: {},
      affixes: [],
      is_in_storage: false,
      quantity: 1,
      slot_index: null,
    }

    expect(getItemTotalStats(gem)).toEqual({ defense: 8 })
  })

  it('formats crit stats for display', () => {
    expect(formatItemStatValue(0.05, 'crit_rate')).toBe('5%')
    expect(formatItemStatValue(0.15, 'crit_damage')).toBe('15%')
    expect(formatItemStatValue(8, 'defense')).toBe(8)
  })
})
