// 游戏类型定义 - Barrel file
// Re-exports from modular type files

// Character types
export type {
  CharacterClass,
  GameCharacter,
  CombatStats,
  StatBreakdownItem,
  CombatStatsBreakdown,
} from './character'
export { CLASS_NAMES } from './character'

// Item and equipment types
export type { ItemQuality, ItemType, EquipmentSlot } from './item'
export type { ItemDefinition, GameItem, Equipment } from './item'
export { QUALITY_COLORS, QUALITY_NAMES, SLOT_NAMES } from './item'

// Skill types
export type { SkillType, SkillTargetType } from './combat'
export type { SkillDefinition, SkillWithLearnedState, CharacterSkill, SkillStage } from './skill'

// Map types
export type { MonsterDefinition, MapDefinition, CharacterMap } from './map'

// Combat types
export type {
  MonsterType,
  CombatMonster,
  SkillUsedEntry,
  CombatResult,
  CombatLog,
  CombatLogDetail,
} from './combat'

// Compendium types
export type { CompendiumItem, CompendiumMonster, CompendiumMonsterDrops } from './compendium'
export type { CompendiumItemsResponse, CompendiumMonstersResponse } from './compendium'

// Events types
export type {
  GameMonstersAppearEvent,
  GameCombatUpdateEvent,
  GameLootDroppedEvent,
  GameLevelUpEvent,
  GameInventoryUpdateEvent,
} from './events'

// Constants and utilities
export { formatCopper, STAT_NAMES, STAT_DESCRIPTIONS } from './constants'

// API Response types (kept inline to avoid circular dependencies)
import type { GameCharacter, CombatStats } from './character'
import type { GameItem, Equipment } from './item'
import type { CharacterSkill, SkillDefinition } from './skill'
import type { MapDefinition, CharacterMap } from './map'

export interface CharacterResponse {
  character: GameCharacter | null
  combat_stats?: CombatStats
  equipped_items?: Record<string, GameItem>
}

export interface CharacterDetailResponse {
  character: GameCharacter
  inventory: GameItem[]
  storage: GameItem[]
  skills: CharacterSkill[]
  available_skills: SkillDefinition[]
  combat_stats: CombatStats
}

export interface InventoryResponse {
  inventory: GameItem[]
  storage: GameItem[]
  equipment: Record<string, Equipment>
  inventory_size: number
  storage_size: number
}

export interface MapsResponse {
  maps: MapDefinition[]
  progress: Record<number, CharacterMap>
  current_map_id: number | null
}

export interface CombatStatusResponse {
  is_fighting: boolean
  current_map: MapDefinition | null
  combat_stats: CombatStats
  last_combat_at: string | null
}
