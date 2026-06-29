import { describe, expect, it } from 'vitest'
import type {
  GameCharacter,
  CombatStats,
  StatBreakdownItem,
  CombatStatsBreakdown,
} from '../character'
import { CLASS_NAMES } from '../character'

describe('character types', () => {
  it('should export CharacterClass type', () => {
    const cls: GameCharacter['class'] = 'warrior'
    expect(cls).toBe('warrior')
  })

  it('should have valid CLASS_NAMES', () => {
    expect(CLASS_NAMES.warrior).toBe('战士')
    expect(CLASS_NAMES.mage).toBe('法师')
    expect(CLASS_NAMES.ranger).toBe('游侠')
  })

  it('should allow creating a GameCharacter', () => {
    const char: GameCharacter = {
      id: 1,
      user_id: 1,
      name: 'Test',
      class: 'warrior',
      level: 1,
      experience: 0,
      copper: 0,
      strength: 10,
      dexterity: 10,
      vitality: 10,
      energy: 10,
      skill_points: 0,
      stat_points: 0,
      current_map_id: null,
      is_fighting: false,
      last_combat_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }
    expect(char.name).toBe('Test')
    expect(char.class).toBe('warrior')
    expect(char.level).toBe(1)
  })

  it('should allow optional fields on GameCharacter', () => {
    const char: GameCharacter = {
      id: 1,
      user_id: 1,
      name: 'Test',
      class: 'mage',
      level: 5,
      experience: 100,
      copper: 500,
      strength: 8,
      dexterity: 12,
      vitality: 8,
      energy: 15,
      skill_points: 2,
      stat_points: 4,
      current_map_id: 1,
      is_fighting: true,
      combat_monster_id: 10,
      last_combat_at: '2024-01-01T00:00:00Z',
      gender: 'female',
      current_hp: 80,
      current_mana: 40,
      auto_recycle_max_value: 100,
      difficulty_tier: 2,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }
    expect(char.gender).toBe('female')
    expect(char.current_hp).toBe(80)
    expect(char.auto_recycle_max_value).toBe(100)
  })

  it('should allow CombatStats', () => {
    const stats: CombatStats = {
      max_hp: 100,
      max_mana: 50,
      attack: 10,
      defense: 5,
      crit_rate: 0.1,
      crit_damage: 1.5,
    }
    expect(stats.max_hp).toBe(100)
    expect(stats.crit_rate).toBeCloseTo(0.1)
  })

  it('should allow StatBreakdownItem', () => {
    const item: StatBreakdownItem = {
      base: 10,
      equipment: 5,
      total: 15,
    }
    expect(item.total).toBe(15)
  })

  it('should allow CombatStatsBreakdown', () => {
    const breakdown: CombatStatsBreakdown = {
      attack: { base: 10, equipment: 5, total: 15 },
      defense: { base: 5, equipment: 3, total: 8 },
      crit_rate: { base: 0.05, equipment: 0.05, total: 0.1 },
      crit_damage: { base: 1.0, equipment: 0.5, total: 1.5 },
    }
    expect(breakdown.attack.total).toBe(15)
    expect(breakdown.crit_rate.total).toBeCloseTo(0.1)
  })

  it('should support null auto_recycle_max_value', () => {
    const char: GameCharacter = {
      id: 1,
      user_id: 1,
      name: 'Test',
      class: 'ranger',
      level: 1,
      experience: 0,
      copper: 0,
      strength: 10,
      dexterity: 10,
      vitality: 10,
      energy: 10,
      skill_points: 0,
      stat_points: 0,
      current_map_id: null,
      is_fighting: false,
      last_combat_at: null,
      auto_recycle_max_value: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }
    expect(char.auto_recycle_max_value).toBeNull()
  })
})
