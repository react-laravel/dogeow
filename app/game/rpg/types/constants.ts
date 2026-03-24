// Constants and utility functions for RPG game types

/** 货币：1金=100银=10000铜。maxParts=1 时只显示一种（金/银/铜取最高位），否则最多两种 */
export function formatCopper(copper: number, maxParts: number = 2): string {
  const g = Math.floor(copper / 10000)
  const s = Math.floor((copper % 10000) / 100)
  const c = copper % 100
  const parts: string[] = []
  if (g > 0) parts.push(`${g}金`)
  if (s > 0) parts.push(`${s}银`)
  if (c > 0 || parts.length === 0) parts.push(`${c}铜`)
  return parts.slice(0, maxParts).join(' ')
}

export const STAT_NAMES: Record<string, string> = {
  attack: '攻击力',
  defense: '防御力',
  max_hp: '生命值',
  max_mana: '魔法值',
  crit_rate: '暴击率',
  crit_damage: '暴击伤害',
  strength: '力量',
  dexterity: '敏捷',
  vitality: '体力',
  energy: '能量',
  all_stats: '全属性',
}

/** 基础属性对战斗属性的影响说明（各职业通用） */
export const STAT_DESCRIPTIONS: Record<'strength' | 'dexterity' | 'vitality' | 'energy', string> = {
  strength: '战士/游侠主属性。物理攻击力 = 力量×2；部分装备有力量需求。',
  dexterity:
    '暴击率每点+1%（上限10%）；格挡率；命中率。游侠主属性，物理攻击 = 敏捷×2。部分装备有敏捷需求。',
  vitality: '最大生命每点+5；防御力每点+0.5。所有职业共用。',
  energy: '法师主属性。法术攻击力 = 精力×2；最大法力每点+3；部分装备有精力需求。',
}