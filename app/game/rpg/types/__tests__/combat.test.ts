import { describe, expect, it } from 'vitest'
import type {
  CombatMonster,
  CombatResult,
  CombatLog,
  CombatLogDetail,
  SkillUsedEntry,
} from '../combat'

describe('combat types', () => {
  it('should allow CombatMonster with optional fields', () => {
    const monster: CombatMonster = {
      id: 1,
      name: 'Goblin',
      type: 'normal',
      level: 1,
      hp: 20,
      max_hp: 20,
    }
    expect(monster.type).toBe('normal')
    expect(monster.hp).toBe(20)
  })

  it('should allow CombatMonster with all optional fields', () => {
    const monster: CombatMonster = {
      id: 1,
      instance_id: 'inst-1',
      icon: 'goblin.png',
      name: 'Goblin',
      type: 'elite',
      level: 5,
      hp: 100,
      max_hp: 100,
      attack: 15,
      defense: 8,
      experience: 50,
      position: 2,
      was_attacked: true,
    }
    expect(monster.instance_id).toBe('inst-1')
    expect(monster.position).toBe(2)
    expect(monster.was_attacked).toBe(true)
  })

  it('should allow SkillUsedEntry', () => {
    const entry: SkillUsedEntry = {
      skill_id: 1,
      name: 'Fireball',
      icon: 'fireball.png',
      effect_key: 'fireball',
      target_type: 'single',
      use_count: 3,
      round: 1,
    }
    expect(entry.name).toBe('Fireball')
    expect(entry.use_count).toBe(3)
  })

  it('should allow SkillUsedEntry with optional fields omitted', () => {
    const entry: SkillUsedEntry = {
      skill_id: 2,
      name: 'Heal',
    }
    expect(entry.icon).toBeUndefined()
    expect(entry.use_count).toBeUndefined()
  })

  it('should allow CombatResult with victory', () => {
    const result: CombatResult = {
      victory: true,
      monster_id: 1,
      monster: {
        name: 'Goblin',
        type: 'normal',
        level: 1,
      },
      damage_dealt: 50,
      damage_taken: 10,
      rounds: 3,
      experience_gained: 100,
      copper_gained: 50,
      loot: {},
      character: {
        id: 1,
        user_id: 1,
        name: 'Hero',
        class: 'warrior',
        level: 1,
        experience: 100,
        copper: 550,
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
      },
    }
    expect(result.victory).toBe(true)
    expect(result.monster.name).toBe('Goblin')
  })

  it('should allow CombatResult with defeat and auto_stopped', () => {
    const result: CombatResult = {
      victory: false,
      defeat: true,
      auto_stopped: true,
      monsters: [
        {
          id: 1,
          name: 'Goblin',
          type: 'normal',
          level: 1,
          hp: 0,
          max_hp: 20,
        },
      ],
      monster: {
        name: 'Goblin',
        type: 'normal',
        level: 1,
      },
      damage_dealt: 30,
      damage_taken: 100,
      rounds: 5,
      experience_gained: 20,
      copper_gained: 10,
      loot: {},
      character: {
        id: 1,
        user_id: 1,
        name: 'Hero',
        class: 'warrior',
        level: 1,
        experience: 20,
        copper: 510,
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
      },
    }
    expect(result.defeat).toBe(true)
    expect(result.auto_stopped).toBe(true)
    expect(result.monsters).toHaveLength(1)
  })

  it('should allow CombatResult with skill_cooldowns', () => {
    const result: CombatResult = {
      victory: true,
      monster: {
        name: 'Goblin',
        type: 'normal',
        level: 1,
      },
      damage_dealt: 50,
      damage_taken: 10,
      rounds: 3,
      experience_gained: 100,
      copper_gained: 50,
      loot: {},
      skill_cooldowns: { 1: 2, 2: 0 },
      character: {
        id: 1,
        user_id: 1,
        name: 'Hero',
        class: 'warrior',
        level: 1,
        experience: 100,
        copper: 550,
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
      },
    }
    expect(result.skill_cooldowns).toEqual({ 1: 2, 2: 0 })
  })

  it('should allow CombatLog', () => {
    const log: CombatLog = {
      id: 1,
      character_id: 1,
      map_id: 1,
      monster_id: 1,
      monster: {
        id: 1,
        name: 'Goblin',
        type: 'normal',
        level: 1,
      },
      map: {
        id: 1,
        name: 'Forest',
      },
      damage_dealt: 50,
      damage_taken: 10,
      victory: true,
      loot_dropped: null,
      experience_gained: 100,
      copper_gained: 50,
      duration_seconds: 30,
      created_at: '2024-01-01T00:00:00Z',
    }
    expect(log.victory).toBe(true)
    expect(log.duration_seconds).toBe(30)
  })

  it('should allow CombatLogDetail', () => {
    const detail: CombatLogDetail = {
      id: 1,
      map: { id: 1, name: 'Forest' },
      monster: { id: 1, name: 'Goblin' },
      victory: true,
      damage_dealt: 50,
      damage_taken: 10,
      experience_gained: 100,
      copper_gained: 50,
      duration_seconds: 30,
      skills_used: [],
      loot_dropped: null,
      round_regen: null,
      created_at: '2024-01-01T00:00:00Z',
      character: {
        level: 1,
        class: 'warrior',
        attack: 10,
        defense: 5,
        crit_rate: 0.1,
        crit_damage: 1.5,
      },
      monster_stats: {
        level: 1,
        hp: 20,
        max_hp: 20,
        attack: 5,
        defense: 2,
        experience: 100,
        copper: 50,
      },
      damage_detail: {
        base_attack: 40,
        skill_damage: 10,
        crit_damage: 0,
        aoe_damage: 0,
        total: 50,
        defense_reduction: 2,
        counter_damage: 0,
      },
      battle: {
        round: 3,
        alive_count: 1,
        killed_count: 1,
      },
      difficulty: {
        tier: 1,
        multiplier: 1.0,
      },
    }
    expect(detail.battle.round).toBe(3)
    expect(detail.damage_detail.total).toBe(50)
  })

  it('should allow CombatLogDetail with optional defense_reduction_percent', () => {
    const detail: CombatLogDetail = {
      id: 1,
      map: { id: 1, name: 'Forest' },
      monster: { id: 1, name: 'Goblin' },
      victory: true,
      damage_dealt: 50,
      damage_taken: 10,
      experience_gained: 100,
      copper_gained: 50,
      duration_seconds: 30,
      skills_used: [],
      loot_dropped: null,
      round_regen: null,
      created_at: '2024-01-01T00:00:00Z',
      character: {
        level: 1,
        class: 'warrior',
        attack: 10,
        defense: 5,
        crit_rate: 0.1,
        crit_damage: 1.5,
      },
      monster_stats: {
        level: 1,
        hp: 20,
        max_hp: 20,
        attack: 5,
        defense: 2,
        experience: 100,
        copper: 50,
      },
      damage_detail: {
        base_attack: 40,
        skill_damage: 10,
        crit_damage: 0,
        aoe_damage: 0,
        total: 50,
        defense_reduction: 2,
        defense_reduction_percent: 10,
        counter_damage: 0,
      },
      battle: {
        round: 3,
        alive_count: 1,
        killed_count: 1,
      },
      difficulty: {
        tier: 1,
        multiplier: 1.0,
      },
    }
    expect(detail.damage_detail.defense_reduction_percent).toBe(10)
  })
})
