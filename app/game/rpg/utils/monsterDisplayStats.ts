import type { CombatMonster } from '../types'

type MonsterDefinitionStats = {
  level: number
  hp_base: number
  attack_base: number
  defense_base: number
  experience_base: number
}

/** 战斗中实例优先，否则使用（已按难度缩放后的）图鉴定义属性 */
export function getMonsterStatDisplay(
  live:
    | Pick<CombatMonster, 'level' | 'max_hp' | 'attack' | 'defense' | 'experience'>
    | null
    | undefined,
  definition: MonsterDefinitionStats
) {
  return {
    level: live?.level ?? definition.level,
    hp: live?.max_hp ?? definition.hp_base,
    attack: live?.attack ?? definition.attack_base,
    defense: live?.defense ?? definition.defense_base,
    experience: live?.experience ?? definition.experience_base,
  }
}
