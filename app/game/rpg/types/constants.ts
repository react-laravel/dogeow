// Constants and utility functions for RPG game types

/** 货币：1金=100银=10000铜。maxParts 用于限制显示的币种段数。 */
export function formatCopper(copper: number, maxParts: number = 3): string {
  const g = Math.floor(copper / 10000)
  const s = Math.floor((copper % 10000) / 100)
  const c = copper % 100
  const parts: string[] = []
  if (g > 0) parts.push(`${g}金`)
  if (s > 0) parts.push(`${s}银`)
  if (c > 0 || parts.length === 0) parts.push(`${c}铜`)
  return parts.slice(0, maxParts).join('')
}

export const STAT_NAMES: Record<string, string> = {
  attack: '攻击力',
  defense: '防御力',
  max_hp: '生命值',
  max_mana: '魔法值',
  crit_rate: '暴击率',
  crit_damage: '暴击伤害',
  strength: '攻击力',
  dexterity: '敏捷',
  vitality: '体力',
  energy: '能量',
  all_stats: '全属性',
}

/** 基础属性对战斗属性的影响说明（各职业通用） */
export const STAT_DESCRIPTIONS: Record<'strength' | 'dexterity' | 'vitality' | 'energy', string> = {
  strength: '所有职业的基础攻击属性。攻击力加点会提升角色基础攻击；部分装备仍可能有力量需求。',
  dexterity: '暴击率每点+0.2%（上限30%）；防御力每点+0.2。部分装备有敏捷需求。',
  vitality: '体力影响生存能力。最大生命每点+3；防御力每点+0.35。所有职业共用。',
  energy: '最大法力每点+2；部分装备有能量需求。',
}
