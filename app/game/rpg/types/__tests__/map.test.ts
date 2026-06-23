import { describe, expect, it } from 'vitest'
import type { MonsterDefinition, MapDefinition, CharacterMap } from '../map'

describe('map types', () => {
  it('should allow MonsterDefinition', () => {
    const monster: MonsterDefinition = {
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
      drop_table: { common: [] },
    }
    expect(monster.name).toBe('Goblin')
    expect(monster.type).toBe('normal')
  })

  it('should allow MonsterDefinition with optional fields', () => {
    const monster: MonsterDefinition = {
      id: 1,
      name: 'Goblin',
      type: 'elite',
      level: 5,
      hp_base: 50,
      hp_per_level: 10,
      attack_base: 10,
      attack_per_level: 2,
      defense_base: 5,
      defense_per_level: 1,
      experience_base: 100,
      experience_per_level: 20,
      drop_table: {},
      icon: 'goblin_elite.png',
    }
    expect(monster.icon).toBe('goblin_elite.png')
  })

  it('should allow MapDefinition', () => {
    const map: MapDefinition = {
      id: 1,
      name: 'Forest',
      act: 1,
      monster_ids: [1, 2, 3],
      monsters: [
        {
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
      ],
      background: '/game/rpg/maps/forest.jpg',
      description: 'A dark forest',
    }
    expect(map.monster_ids).toHaveLength(3)
    expect(map.monsters).toHaveLength(1)
  })

  it('should allow MapDefinition without optional fields', () => {
    const map: MapDefinition = {
      id: 1,
      name: 'Village',
      act: 1,
      monster_ids: [],
    }
    expect(map.monsters).toBeUndefined()
    expect(map.background).toBeUndefined()
    expect(map.description).toBeUndefined()
  })

  it('should allow CharacterMap', () => {
    const charMap: CharacterMap = {
      id: 1,
      character_id: 1,
      map_id: 1,
      map: {
        id: 1,
        name: 'Forest',
        act: 1,
        monster_ids: [1],
      },
      unlocked: true,
      teleport_unlocked: true,
    }
    expect(charMap.unlocked).toBe(true)
    expect(charMap.teleport_unlocked).toBe(true)
  })

  it('should allow CharacterMap with locked states', () => {
    const charMap: CharacterMap = {
      id: 1,
      character_id: 1,
      map_id: 2,
      map: {
        id: 2,
        name: 'Cave',
        act: 1,
        monster_ids: [],
      },
      unlocked: false,
      teleport_unlocked: false,
    }
    expect(charMap.unlocked).toBe(false)
  })

  it('should support all monster types', () => {
    const types = ['normal', 'elite', 'boss'] as const
    types.forEach(type => {
      const monster: MonsterDefinition = {
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
