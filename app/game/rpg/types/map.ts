// Map types for RPG game

export interface MonsterDefinition {
  id: number
  name: string
  type: 'normal' | 'elite' | 'boss'
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
}

export interface MapDefinition {
  id: number
  name: string
  act: number
  monster_ids: number[]
  monsters?: MonsterDefinition[]
  background?: string
  description?: string
}

export interface CharacterMap {
  id: number
  character_id: number
  map_id: number
  map: MapDefinition
  unlocked: boolean
  teleport_unlocked: boolean
}