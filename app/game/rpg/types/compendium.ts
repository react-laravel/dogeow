// Compendium types for RPG game

import type { ItemType, ItemQuality } from './item'

export type MonsterType = 'normal' | 'elite' | 'boss'

export interface CompendiumItem {
  id: number
  name: string
  type: ItemType
  sub_type?: string
  base_stats: Record<string, number>
  required_level: number
  icon?: string
  description?: string
  drop_rate?: number
  weight?: number
  quality?: string
  discovered?: boolean
}

export interface CompendiumMonster {
  id: number
  name: string
  type: MonsterType
  level: number
  hp_base: number
  hp_per_level: number
  attack_base: number
  attack_per_level: number
  defense_base: number
  defense_per_level: number
  experience_base: number
  experience_per_level: number
  drop_table: Record<string, unknown>
  icon?: string
  discovered?: boolean
}

export interface CompendiumMonsterDrops {
  monster: CompendiumMonster
  drop_table: Record<string, unknown>
  drop_rates: {
    item: number
    gold: number
  }
  possible_items: CompendiumItem[]
}

export interface CompendiumItemsResponse {
  items: CompendiumItem[]
  total: number
  discovered_count: number
}

export interface CompendiumMonstersResponse {
  monsters: CompendiumMonster[]
  total: number
  discovered_count: number
}
