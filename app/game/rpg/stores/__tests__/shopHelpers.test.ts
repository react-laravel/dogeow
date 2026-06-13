import { describe, expect, it } from 'vitest'
import type { CompendiumItem, ShopItem } from '../../types'
import { normalizeShopItemsWithSystemPotions } from '../shopHelpers'

const sword: ShopItem = {
  id: 1,
  listing_id: 'weapon-1',
  name: '铁剑',
  type: 'weapon',
  base_stats: { attack: 3 },
  quality: 'common',
  required_level: 1,
  buy_price: 30,
  sell_price: 6,
}

const randomPotion: ShopItem = {
  id: 10,
  listing_id: 'random-potion-1',
  name: '小型生命药水',
  type: 'potion',
  sub_type: 'hp',
  base_stats: { max_hp: 999 },
  quality: 'rare',
  required_level: 1,
  buy_price: 99,
  sell_price: 19,
}

describe('normalizeShopItemsWithSystemPotions', () => {
  it('replaces random shop potions with fixed system potion definitions', () => {
    const systemPotions: Array<CompendiumItem & { buy_price: number; sell_price: number }> = [
      {
        id: 10,
        name: '小型生命药水',
        type: 'potion',
        sub_type: 'hp',
        base_stats: { max_hp: 50 },
        required_level: 1,
        quality: 'common',
        buy_price: 5,
        sell_price: 1,
      },
      {
        id: 11,
        name: '小型法力药水',
        type: 'potion',
        sub_type: 'mp',
        base_stats: { max_mana: 50 },
        required_level: 1,
        quality: 'common',
        buy_price: 5,
        sell_price: 1,
      },
    ]

    const items = normalizeShopItemsWithSystemPotions([sword, randomPotion], systemPotions)

    expect(items).toHaveLength(3)
    expect(items[0]).toEqual(sword)
    expect(items.filter(item => item.type === 'potion')).toEqual([
      expect.objectContaining({
        id: 10,
        name: '小型生命药水',
        base_stats: { max_hp: 50 },
        quality: 'common',
        buy_price: 5,
      }),
      expect.objectContaining({
        id: 11,
        name: '小型法力药水',
        base_stats: { max_mana: 50 },
        buy_price: 5,
      }),
    ])
  })

  it('dedupes shop potions when system definitions are unavailable', () => {
    const items = normalizeShopItemsWithSystemPotions([sword, randomPotion, randomPotion])

    expect(items).toEqual([sword, randomPotion])
  })
})
