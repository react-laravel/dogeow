// Shop types for RPG game

import type { ItemType, ItemQuality } from './item'

export interface ShopItem {
  id: number
  name: string
  type: ItemType
  sub_type?: string
  base_stats: Record<string, number>
  quality: ItemQuality
  required_level: number
  icon?: string
  description?: string
  buy_price: number
  sell_price: number
}

export interface ShopResponse {
  items: ShopItem[]
  player_copper: number
  /** 下次商店装备刷新的时间戳（秒） */
  next_refresh_at?: number
}

export interface BuyResponse {
  copper: number
  total_price: number
  quantity: number
  item_name: string
}

export interface SellResponse {
  copper: number
  sell_price: number
  quantity: number
  item_name: string
}