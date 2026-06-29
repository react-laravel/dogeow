import { describe, expect, it } from 'vitest'
import type {
  CompendiumItem,
  CompendiumMonster,
  CompendiumMonsterDrops,
  CompendiumItemsResponse,
  CompendiumMonstersResponse,
} from '../compendium'

describe('compendium types', () => {
  it('should allow CompendiumItem with all fields', () => {
    const item: CompendiumItem = {
      id: 1,
      name: 'Iron Sword',
      type: 'weapon',
      sub_type: 'sword',
      base_stats: { attack: 5 },
      required_level: 1,
      icon: 'sword.png',
      description: 'A basic iron sword',
      drop_rate: 0.1,
      weight: 100,
      quality: 'common',
      discovered: true,
    }
    expect(item.type).toBe('weapon')
    expect(item.discovered).toBe(true)
  })

  it('should allow CompendiumItem with required fields only', () => {
    const item: CompendiumItem = {
      id: 1,
      name: 'Ruby',
      type: 'gem',
      base_stats: { max_hp: 50 },
      required_level: 1,
    }
    expect(item.sub_type).toBeUndefined()
    expect(item.discovered).toBeUndefined()
  })

  it('should allow CompendiumMonster', () => {
    const monster: CompendiumMonster = {
      id: 1,
      name: 'Goblin',
      type: 'normal',
      level: 1,
      hp_base: 20,
      hp_per_level: 5,
      attack_base: 5,
      attack_per_level: 1,
      defense_base: 2,
      defense_per_level: 0.5,
      experience_base: 50,
      experience_per_level: 10,
      drop_table: {},
      icon: 'goblin.png',
      discovered: true,
    }
    expect(monster.level).toBe(1)
    expect(monster.discovered).toBe(true)
  })

  it('should allow CompendiumMonster without optional fields', () => {
    const monster: CompendiumMonster = {
      id: 1,
      name: 'Goblin',
      type: 'elite',
      level: 5,
      hp_base: 20,
      hp_per_level: 5,
      attack_base: 5,
      attack_per_level: 1,
      defense_base: 2,
      defense_per_level: 0.5,
      experience_base: 50,
      experience_per_level: 10,
      drop_table: { common: [{ id: 1, chance: 0.5 }] },
    }
    expect(monster.icon).toBeUndefined()
    expect(monster.discovered).toBeUndefined()
  })

  it('should allow CompendiumMonsterDrops', () => {
    const drops: CompendiumMonsterDrops = {
      monster: {
        id: 1,
        name: 'Goblin',
        type: 'normal',
        level: 1,
        hp_base: 20,
        hp_per_level: 5,
        attack_base: 5,
        attack_per_level: 1,
        defense_base: 2,
        defense_per_level: 0.5,
        experience_base: 50,
        experience_per_level: 10,
        drop_table: {},
      },
      drop_table: { common: [] },
      drop_rates: {
        item: 0.3,
        gold: 0.5,
      },
      possible_items: [],
    }
    expect(drops.drop_rates.item).toBeCloseTo(0.3)
    expect(drops.possible_items).toHaveLength(0)
  })

  it('should allow CompendiumMonsterDrops with possible items', () => {
    const drops: CompendiumMonsterDrops = {
      monster: {
        id: 1,
        name: 'Goblin',
        type: 'normal',
        level: 1,
        hp_base: 20,
        hp_per_level: 5,
        attack_base: 5,
        attack_per_level: 1,
        defense_base: 2,
        defense_per_level: 0.5,
        experience_base: 50,
        experience_per_level: 10,
        drop_table: {},
      },
      drop_table: {},
      drop_rates: { item: 0.3, gold: 0.5 },
      possible_items: [
        {
          id: 1,
          name: 'Gold',
          type: 'gem',
          base_stats: {},
          required_level: 1,
        },
      ],
    }
    expect(drops.possible_items).toHaveLength(1)
  })

  it('should allow CompendiumItemsResponse', () => {
    const response: CompendiumItemsResponse = {
      items: [],
      total: 10,
      discovered_count: 5,
    }
    expect(response.total).toBe(10)
    expect(response.discovered_count).toBe(5)
  })

  it('should allow CompendiumMonstersResponse', () => {
    const response: CompendiumMonstersResponse = {
      monsters: [],
      total: 5,
      discovered_count: 2,
    }
    expect(response.total).toBe(5)
  })

  it('should support all MonsterType values in CompendiumMonster', () => {
    const types = ['normal', 'elite', 'boss'] as const
    types.forEach(type => {
      const monster: CompendiumMonster = {
        id: 1,
        name: 'Test',
        type,
        level: 1,
        hp_base: 10,
        hp_per_level: 5,
        attack_base: 5,
        attack_per_level: 1,
        defense_base: 2,
        defense_per_level: 0.5,
        experience_base: 50,
        experience_per_level: 10,
        drop_table: {},
      }
      expect(monster.type).toBe(type)
    })
  })
})
