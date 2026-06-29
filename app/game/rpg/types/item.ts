// Item and equipment types for RPG game

export type ItemQuality = 'common' | 'magic' | 'rare' | 'legendary' | 'mythic'
export type ItemType =
  | 'weapon'
  | 'helmet'
  | 'armor'
  | 'gloves'
  | 'boots'
  | 'belt'
  | 'ring'
  | 'amulet'
  | 'gem'
export type EquipmentSlot =
  | 'weapon'
  | 'helmet'
  | 'armor'
  | 'gloves'
  | 'boots'
  | 'belt'
  | 'ring'
  | 'amulet'

export interface ItemDefinition {
  id: number
  name: string
  type: ItemType
  sub_type?: string
  base_stats: Record<string, number>
  /** 宝石镶嵌加成（仅 type=gem 时有值） */
  gem_stats?: Record<string, number>
  required_level: number
  icon?: string
  description?: string
  buy_price?: number
}

export interface GameItem {
  id: number
  character_id: number
  definition_id: number
  definition: ItemDefinition
  quality: ItemQuality
  stats: Record<string, number>
  affixes: Record<string, number>[]
  is_in_storage: boolean
  quantity: number
  slot_index: number | null
  sell_price?: number
  sockets?: number
  gems?: Array<{
    id: number
    socket_index: number
    gemDefinition: ItemDefinition
  }>
}

export interface Equipment {
  slot: EquipmentSlot
  item: GameItem | null
}

// 常量
export const QUALITY_COLORS: Record<ItemQuality, string> = {
  common: '#9ca3af',
  magic: '#6888ff',
  rare: '#ffcc00',
  legendary: '#ff8000',
  mythic: '#00ff00',
}

export const QUALITY_NAMES: Record<ItemQuality, string> = {
  common: '普通',
  magic: '魔法',
  rare: '稀有',
  legendary: '传奇',
  mythic: '神话',
}

export const SLOT_NAMES: Record<EquipmentSlot, string> = {
  weapon: '武器',
  helmet: '头盔',
  armor: '盔甲',
  gloves: '手套',
  boots: '靴子',
  belt: '腰带',
  ring: '戒指',
  amulet: '护符',
}
