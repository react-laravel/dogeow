import { describe, expect, it } from 'vitest'
import type { ShopItem, ShopResponse, BuyResponse, SellResponse } from '../shop'

describe('shop types', () => {
  it('should allow ShopItem', () => {
    const item: ShopItem = {
      id: 1,
      listing_id: 'weapon-1',
      name: 'Iron Sword',
      type: 'weapon',
      sub_type: 'sword',
      base_stats: { attack: 5 },
      quality: 'common',
      required_level: 1,
      icon: 'sword.png',
      description: 'A basic sword',
      buy_price: 100,
      sell_price: 20,
    }
    expect(item.listing_id).toBe('weapon-1')
    expect(item.buy_price).toBe(100)
  })

  it('should allow ShopItem without optional fields', () => {
    const item: ShopItem = {
      id: 1,
      name: 'Potion',
      type: 'potion',
      base_stats: { max_hp: 50 },
      quality: 'common',
      required_level: 1,
      buy_price: 10,
      sell_price: 2,
    }
    expect(item.listing_id).toBeUndefined()
    expect(item.icon).toBeUndefined()
  })

  it('should allow ShopResponse', () => {
    const response: ShopResponse = {
      items: [],
      player_copper: 1000,
      next_refresh_at: 1700000000,
      manual_refresh_enabled: true,
    }
    expect(response.player_copper).toBe(1000)
    expect(response.next_refresh_at).toBe(1700000000)
  })

  it('should allow ShopResponse without optional fields', () => {
    const response: ShopResponse = {
      items: [],
      player_copper: 500,
    }
    expect(response.next_refresh_at).toBeUndefined()
    expect(response.manual_refresh_enabled).toBeUndefined()
  })

  it('should allow BuyResponse', () => {
    const response: BuyResponse = {
      copper: 900,
      total_price: 100,
      quantity: 1,
      item_name: 'Iron Sword',
    }
    expect(response.copper).toBe(900)
    expect(response.total_price).toBe(100)
  })

  it('should allow SellResponse', () => {
    const response: SellResponse = {
      copper: 1100,
      sell_price: 100,
      quantity: 1,
      item_name: 'Old Sword',
    }
    expect(response.sell_price).toBe(100)
  })

  it('should allow ShopItem with different item types', () => {
    const types = [
      'weapon',
      'helmet',
      'armor',
      'gloves',
      'boots',
      'belt',
      'ring',
      'amulet',
      'potion',
      'gem',
    ] as const
    types.forEach(type => {
      const item: ShopItem = {
        id: 1,
        name: 'Test',
        type,
        base_stats: {},
        quality: 'common',
        required_level: 1,
        buy_price: 10,
        sell_price: 2,
      }
      expect(item.type).toBe(type)
    })
  })
})
