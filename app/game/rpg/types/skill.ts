// Skill types for RPG game

import type { CharacterClass } from './character'

export type SkillStage = 'basic' | 'core' | 'defensive' | 'special' | 'ultimate' | 'key_passive'
import type { SkillType, SkillTargetType } from './combat'

/** 技能定义 */
export interface SkillDefinition {
  id: number
  name: string
  description?: string
  type: SkillType
  class_restriction: CharacterClass | 'all'
  /** 技能分支/流派（兼容旧数据） */
  branch?: string
  /** 技能层级（兼容旧数据）：1基础/2中级/3高级 */
  tier?: number
  /** D4 阶段：basic/core/defensive/special/ultimate/key_passive */
  skill_stage?: SkillStage | null
  /** 技能线标识 */
  skill_line?: string | null
  /** 节点层级：0本体/1强化/2专精 */
  node_tier?: number | null
  /** 专精分支：a/b */
  spec_branch?: 'a' | 'b' | null
  /** 阶段解锁等级 */
  unlock_level?: number
  /** 前置技能ID（学习此技能需要先学习前置技能） */
  prerequisite_skill_id?: number | null
  /** 前置技能效果键（根据 effect_key 判断前置条件） */
  prerequisite_effect_key?: string | null
  /** 技能特效标识，用于前置条件判断 */
  effect_key?: string | null
  max_level: number
  base_damage: number
  damage_per_level: number
  mana_cost: number
  mana_cost_per_level: number
  cooldown: number
  icon?: string
  effects?: Record<string, unknown>
  /** 单体(single) 或 群体(all) */
  target_type?: SkillTargetType
  skill_points_cost?: number
}

/** 技能列表项：定义 + 是否已学；已学时含 character_skill_id、level、slot_index */
export interface SkillWithLearnedState extends SkillDefinition {
  is_learned: boolean
  character_skill_id?: number
  level?: number
  slot_index?: number | null
}

export interface CharacterSkill {
  id: number
  character_id: number
  skill_id: number
  skill: SkillDefinition
  level: number
  slot_index: number | null
}
