import { describe, it, expect } from 'vitest'
import {
  formatCopper,
  QUALITY_COLORS,
  QUALITY_NAMES,
  CLASS_NAMES,
  SLOT_NAMES,
  STAT_NAMES,
  STAT_DESCRIPTIONS,
} from '../index'
import type {
  CharacterClass,
  CharacterMap,
  CombatLog,
  CombatLogDetail,
  CombatMonster,
  CombatResult,
  CombatStats,
  CompendiumItem,
  CompendiumMonster,
  EquipmentSlot,
  GameCharacter,
  GameItem,
  ItemQuality,
  ItemType,
  MapDefinition,
  MonsterDefinition,
  MonsterType,
  SkillDefinition,
  SkillType,
  SkillWithLearnedState,
} from '../index'

type ExpectedTypeExports = [
  CharacterClass,
  GameCharacter,
  ItemQuality,
  ItemType,
  EquipmentSlot,
  GameItem,
  CombatStats,
  CombatMonster,
  CombatResult,
  CombatLog,
  CombatLogDetail,
  SkillType,
  SkillDefinition,
  SkillWithLearnedState,
  MapDefinition,
  CharacterMap,
  MonsterType,
  MonsterDefinition,
  CompendiumItem,
  CompendiumMonster,
]

describe('RPG Types', () => {
  describe('formatCopper', () => {
    it('should format copper only (less than 100)', () => {
      expect(formatCopper(50)).toBe('50铜')
    })

    it('should format silver and copper', () => {
      expect(formatCopper(150)).toBe('1银50铜')
    })

    it('should format gold, silver and copper', () => {
      expect(formatCopper(12345)).toBe('1金23银45铜')
    })

    it('should handle zero copper', () => {
      expect(formatCopper(0)).toBe('0铜')
    })

    it('should limit parts with maxParts parameter', () => {
      expect(formatCopper(12345, 1)).toBe('1金')
      expect(formatCopper(12345, 2)).toBe('1金23银')
      expect(formatCopper(12345, 3)).toBe('1金23银45铜')
    })

    it('should handle large values', () => {
      expect(formatCopper(1000000)).toBe('100金')
      expect(formatCopper(10050)).toBe('1金50铜')
    })

    it('should not show zero silver when maxParts is 1', () => {
      expect(formatCopper(10001, 1)).toBe('1金')
    })

    it('should handle only gold (exact gold amounts)', () => {
      expect(formatCopper(10000)).toBe('1金')
      expect(formatCopper(20000)).toBe('2金')
    })
  })

  describe('QUALITY_COLORS', () => {
    it('should have colors for all quality types', () => {
      expect(QUALITY_COLORS.common).toBe('#9ca3af')
      expect(QUALITY_COLORS.magic).toBe('#6888ff')
      expect(QUALITY_COLORS.rare).toBe('#ffcc00')
      expect(QUALITY_COLORS.legendary).toBe('#ff8000')
      expect(QUALITY_COLORS.mythic).toBe('#00ff00')
    })
  })

  describe('QUALITY_NAMES', () => {
    it('should have names for all quality types', () => {
      expect(QUALITY_NAMES.common).toBe('普通')
      expect(QUALITY_NAMES.magic).toBe('魔法')
      expect(QUALITY_NAMES.rare).toBe('稀有')
      expect(QUALITY_NAMES.legendary).toBe('传奇')
      expect(QUALITY_NAMES.mythic).toBe('神话')
    })
  })

  describe('CLASS_NAMES', () => {
    it('should have names for all character classes', () => {
      expect(CLASS_NAMES.warrior).toBe('战士')
      expect(CLASS_NAMES.mage).toBe('法师')
      expect(CLASS_NAMES.ranger).toBe('游侠')
    })
  })

  describe('SLOT_NAMES', () => {
    it('should have names for all equipment slots', () => {
      expect(SLOT_NAMES.weapon).toBe('武器')
      expect(SLOT_NAMES.helmet).toBe('头盔')
      expect(SLOT_NAMES.armor).toBe('盔甲')
      expect(SLOT_NAMES.gloves).toBe('手套')
      expect(SLOT_NAMES.boots).toBe('靴子')
      expect(SLOT_NAMES.belt).toBe('腰带')
      expect(SLOT_NAMES.ring).toBe('戒指')
      expect(SLOT_NAMES.amulet).toBe('护符')
    })
  })

  describe('STAT_NAMES', () => {
    it('should have names for all stats', () => {
      expect(STAT_NAMES.attack).toBe('攻击力')
      expect(STAT_NAMES.defense).toBe('防御力')
      expect(STAT_NAMES.max_hp).toBe('生命值')
      expect(STAT_NAMES.max_mana).toBe('魔法值')
      expect(STAT_NAMES.crit_rate).toBe('暴击率')
      expect(STAT_NAMES.crit_damage).toBe('暴击伤害')
      expect(STAT_NAMES.strength).toBe('攻击力')
      expect(STAT_NAMES.dexterity).toBe('敏捷')
      expect(STAT_NAMES.vitality).toBe('体力')
      expect(STAT_NAMES.energy).toBe('能量')
      expect(STAT_NAMES.all_stats).toBe('全属性')
    })
  })

  describe('STAT_DESCRIPTIONS', () => {
    it('should have descriptions for base stats', () => {
      expect(STAT_DESCRIPTIONS.strength).toContain('攻击力')
      expect(STAT_DESCRIPTIONS.dexterity).toContain('敏捷')
      expect(STAT_DESCRIPTIONS.vitality).toContain('体力')
      expect(STAT_DESCRIPTIONS.energy).toContain('能量')
    })

    it('should describe strength correctly for all classes', () => {
      expect(STAT_DESCRIPTIONS.strength).toContain('所有职业')
      expect(STAT_DESCRIPTIONS.strength).toContain('攻击力')
    })

    it('should describe dexterity correctly for crit rate', () => {
      expect(STAT_DESCRIPTIONS.dexterity).toContain('暴击率')
      expect(STAT_DESCRIPTIONS.dexterity).toContain('防御力')
    })

    it('should describe vitality correctly for HP and defense', () => {
      expect(STAT_DESCRIPTIONS.vitality).toContain('最大生命')
      expect(STAT_DESCRIPTIONS.vitality).toContain('防御力')
    })

    it('should describe energy correctly for mana', () => {
      expect(STAT_DESCRIPTIONS.energy).toContain('最大法力')
      expect(STAT_DESCRIPTIONS.energy).toContain('能量需求')
    })
  })
})

describe('Type Exports', () => {
  it('should expose all expected TypeScript types', () => {
    const typeCheckOnly: ExpectedTypeExports | null = null
    expect(typeCheckOnly).toBeNull()
  })
})
