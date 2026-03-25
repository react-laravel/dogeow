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
  | 'potion'
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

// ============================================================================
// Quality-based Style Helpers - Extracted to resolve DRY violations
// ============================================================================

/**
 * Get gradient background style for item quality
 * @param quality Item quality level
 * @param opacity1 First color opacity suffix (default "20")
 * @param opacity2 Second color opacity suffix (default "10")
 */
export function getQualityGradient(
  quality: ItemQuality,
  opacity1: string = '20',
  opacity2: string = '10'
): string {
  const p1 = opacity1.padStart(2, '0')
  const p2 = opacity2.padStart(2, '0')
  return `linear-gradient(135deg, ${QUALITY_COLORS[quality]}${p1} 0%, ${QUALITY_COLORS[quality]}${p2} 100%)`
}

/**
 * Get border style for item quality
 * @param quality Item quality level
 * @param opacity Border color opacity suffix (default "30")
 */
export function getQualityBorderStyle(quality: ItemQuality, opacity: string = '30'): string {
  const p = opacity.padStart(2, '0')
  return `1px solid ${QUALITY_COLORS[quality]}${p}`
}

/**
 * Get text color for item quality
 */
export function getQualityColor(quality: ItemQuality): string {
  return QUALITY_COLORS[quality]
}
