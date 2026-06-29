import { describe, expect, it } from 'vitest'
import {
  formatAffixLine,
  formatItemStatValue,
  getCompareStatKeys,
  getDisplayableItemStats,
  getEffectiveSocketCount,
  getItemTotalStats,
  MAX_ITEM_SOCKETS,
} from '../itemUtils'
import type { GameItem } from '../../types'

describe('itemUtils', () => {
  it('merges compare stat keys in STAT_NAMES order', () => {
    expect(
      getCompareStatKeys({ attack: 10, max_hp: 100 }, { defense: 5, crit_rate: 0.05 })
    ).toEqual(['attack', 'defense', 'max_hp', 'crit_rate'])
  })

  it('caps effective socket count at MAX_ITEM_SOCKETS', () => {
    expect(MAX_ITEM_SOCKETS).toBe(3)
    expect(getEffectiveSocketCount(4)).toBe(3)
    expect(getEffectiveSocketCount(2)).toBe(2)
    expect(getEffectiveSocketCount(undefined)).toBe(0)
  })

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

  it('includes socketed gem stats for equipment items', () => {
    const sword: GameItem = {
      id: 2,
      character_id: 1,
      definition_id: 1,
      definition: {
        id: 1,
        name: 'Sword',
        type: 'weapon',
        base_stats: {},
        required_level: 1,
      },
      quality: 'common',
      stats: { attack: 10 },
      affixes: [{ defense: 2 }],
      is_in_storage: false,
      quantity: 1,
      slot_index: null,
      sockets: 1,
      gems: [
        {
          id: 10,
          socket_index: 0,
          gemDefinition: {
            id: 147,
            name: 'Ruby',
            type: 'gem',
            base_stats: {},
            gem_stats: { attack: 5 },
            required_level: 1,
          },
        },
      ],
    }

    expect(getItemTotalStats(sword)).toEqual({ attack: 15, defense: 2 })
  })

  it('formats crit stats for display', () => {
    expect(formatItemStatValue(0.05, 'crit_rate')).toBe('5%')
    expect(formatItemStatValue(0.15, 'crit_damage')).toBe('15%')
    expect(formatItemStatValue(8, 'defense')).toBe(8)
  })

  it('filters zero and hidden stats from displayable stats', () => {
    expect(
      getDisplayableItemStats({
        attack: 10,
        defense: 0,
        price: 100,
        max_hp: 0,
      })
    ).toEqual({ attack: 10 })
  })

  it('returns null for empty affix lines', () => {
    expect(formatAffixLine({})).toBeNull()
    expect(formatAffixLine({ attack: 0 })).toBeNull()
    expect(formatAffixLine({ attack: 5 })).toBe('+5 攻击力')
  })
})
