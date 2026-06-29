// Combat types for RPG game
import type { GameItem } from './item'
import type { GameCharacter } from './character'

export type MonsterType = 'normal' | 'elite' | 'boss'
export type SkillType = 'active' | 'passive'
export type SkillTargetType = 'single' | 'all'

/** 战斗中怪物信息 */
export interface CombatMonster {
  id: number
  /** 怪物实例唯一ID，用于前端检测新怪物 */
  instance_id?: string
  icon?: string
  name: string
  type: MonsterType
  level: number
  hp: number
  max_hp: number
  attack?: number
  defense?: number
  experience?: number
  /** 怪物在战斗阵列中的位置 (0-4) */
  position?: number
  /** 本回合是否被攻击 */
  was_attacked?: boolean
}

/** 单场战斗中释放的技能（含次数） */
export interface SkillUsedEntry {
  skill_id: number
  name: string
  icon?: string | null
  /** 前端技能特效标识，由后端配置 */
  effect_key?: string | null
  target_type?: 'single' | 'all'
  passive_effects?: Record<string, unknown>
  passive_names?: string[]
  use_count?: number
  round?: number
}

export interface CombatResult {
  victory: boolean
  defeat?: boolean
  auto_stopped?: boolean
  monster_id?: number
  /** 多怪物数组 */
  monsters?: CombatMonster[]
  monster: {
    name: string
    type: MonsterType
    level: number
    hp?: number
    max_hp?: number
  }
  /** 本回合开始时的怪物血量，用于先渲染再播扣血动画 */
  monster_hp_before_round?: number
  damage_dealt: number
  damage_taken: number
  rounds: number
  experience_gained: number
  copper_gained: number
  loot: {
    copper?: number
    item?: GameItem
    item_lost?: boolean
    item_lost_reason?: string
  }
  skills_used?: SkillUsedEntry[]
  skill_target_positions?: number[] // 技能命中的怪物位置 (0-4)
  /** 技能冷却（回合数） */
  skill_cooldowns?: Record<number, number>
  /** 回合结束自动恢复记录 */
  round_regen?: Record<string, { name: string; restored: number }> | null
  character: GameCharacter
  /** 仅当本场战斗结束（胜利/失败）时存在 */
  combat_log_id?: number
}

export interface CombatLog {
  id: number
  character_id: number
  map_id: number
  monster_id: number
  monster:
    | {
        id?: number
        name?: string
        type?: MonsterType
        level?: number
      }
    | string
    | null
  map:
    | {
        id?: number
        name?: string
      }
    | string
    | null
  damage_dealt: number
  damage_taken: number
  victory: boolean
  loot_dropped: Record<string, unknown> | null
  loot?: {
    copper?: number
    item?: GameItem
    item_lost?: boolean
    item_lost_reason?: string
  }
  experience_gained: number
  copper_gained: number
  duration_seconds: number
  skills_used?: SkillUsedEntry[]
  /** 回合结束自动恢复记录 */
  round_regen?: Record<string, { name: string; restored: number }> | null
  created_at: string
}

/** 战斗日志详情 */
export interface CombatLogDetail {
  id: number
  map: {
    id: number
    name: string
  }
  monster: {
    id: number
    name: string
  }
  victory: boolean
  damage_dealt: number
  damage_taken: number
  experience_gained: number
  copper_gained: number
  duration_seconds: number
  skills_used: SkillUsedEntry[]
  loot_dropped: Record<string, unknown> | null
  round_regen?: Record<string, { name: string; restored: number }> | null
  created_at: string
  character: {
    level: number
    class: string
    attack: number
    defense: number
    crit_rate: number
    crit_damage: number
  }
  monster_stats: {
    level: number
    hp: number
    max_hp: number
    attack: number
    defense: number
    experience: number
    copper: number
  }
  damage_detail: {
    base_attack: number
    skill_damage: number
    crit_damage: number
    aoe_damage: number
    total: number
    defense_reduction: number
    defense_reduction_percent?: number
    counter_damage: number
  }
  battle: {
    round?: number
    alive_count: number
    killed_count: number
  }
  difficulty: {
    tier: number
    multiplier: number
  }
}
