// Character types for RPG game

export type CharacterClass = 'warrior' | 'mage' | 'ranger'

export interface GameCharacter {
  id: number
  user_id: number
  name: string
  class: CharacterClass
  gender?: 'male' | 'female'
  level: number
  experience: number
  copper: number
  strength: number
  dexterity: number
  vitality: number
  energy: number
  skill_points: number
  stat_points: number
  current_map_id: number | null
  is_fighting: boolean
  combat_monster_id?: number | null
  last_combat_at: string | null
  difficulty_tier?: number
  current_hp?: number
  current_mana?: number
  /** 自动回收单价上限（铜），null/0 表示关闭 */
  auto_recycle_max_value?: number | null
  created_at: string
  updated_at: string
}

export interface CombatStats {
  max_hp: number
  max_mana: number
  attack: number
  defense: number
  crit_rate: number
  crit_damage: number
}

/** 单条战斗属性的明细（基础 + 装备） */
export interface StatBreakdownItem {
  base: number
  equipment: number
  total: number
}

export interface CombatStatsBreakdown {
  attack: StatBreakdownItem
  defense: StatBreakdownItem
  crit_rate: StatBreakdownItem
  crit_damage: StatBreakdownItem
}

export const CLASS_NAMES: Record<CharacterClass, string> = {
  warrior: '战士',
  mage: '法师',
  ranger: '游侠',
}
