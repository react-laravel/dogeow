import type { GameCharacter } from './character'

export type MercenaryRole = 'guard' | 'marksman' | 'mystic'

export interface MercenaryDefinition {
  role: MercenaryRole
  name: string
  title: string
  description: string
  skillName: string
  statBias: 'defense' | 'attack' | 'support'
}

export interface Mercenary {
  id: string
  character_id: number
  role: MercenaryRole
  name: string
  level: number
  experience: number
  attack: number
  defense: number
  max_hp: number
  crit_rate: number
  skill_name: string
  hired_at: string
}

export const MERCENARY_DEFINITIONS: Record<MercenaryRole, MercenaryDefinition> = {
  guard: {
    role: 'guard',
    name: '铁卫',
    title: '防御型雇佣兵',
    description: '生命和防御较高，适合帮角色分担压力。',
    skillName: '盾墙',
    statBias: 'defense',
  },
  marksman: {
    role: 'marksman',
    name: '猎弩手',
    title: '远程型雇佣兵',
    description: '攻击和暴击更高，适合提升刷怪速度。',
    skillName: '穿刺弩箭',
    statBias: 'attack',
  },
  mystic: {
    role: 'mystic',
    name: '秘术师',
    title: '辅助型雇佣兵',
    description: '提供稳定输出和续航支援，适合法师与长线挂机。',
    skillName: '灵能回响',
    statBias: 'support',
  },
}

export function createMercenaryForCharacter(
  character: Pick<GameCharacter, 'id' | 'level'>,
  role: MercenaryRole
): Mercenary {
  const definition = MERCENARY_DEFINITIONS[role]
  const level = Math.max(1, character.level)
  const roleStats = {
    guard: {
      attack: Math.round(8 + level * 2.4),
      defense: Math.round(12 + level * 3.2),
      max_hp: Math.round(90 + level * 24),
      crit_rate: 0.04,
    },
    marksman: {
      attack: Math.round(14 + level * 3.6),
      defense: Math.round(7 + level * 1.8),
      max_hp: Math.round(62 + level * 16),
      crit_rate: 0.11,
    },
    mystic: {
      attack: Math.round(11 + level * 2.9),
      defense: Math.round(9 + level * 2.2),
      max_hp: Math.round(72 + level * 18),
      crit_rate: 0.07,
    },
  }[role]

  return {
    id: `${character.id}:${role}`,
    character_id: character.id,
    role,
    name: definition.name,
    level,
    experience: 0,
    attack: roleStats.attack,
    defense: roleStats.defense,
    max_hp: roleStats.max_hp,
    crit_rate: roleStats.crit_rate,
    skill_name: definition.skillName,
    hired_at: new Date().toISOString(),
  }
}

export function syncMercenaryLevel(
  mercenary: Mercenary,
  character: Pick<GameCharacter, 'id' | 'level'>
): Mercenary {
  if (mercenary.character_id !== character.id || mercenary.level === character.level) {
    return mercenary
  }

  return {
    ...createMercenaryForCharacter(character, mercenary.role),
    hired_at: mercenary.hired_at,
    experience: mercenary.experience,
  }
}
