import { describe, expect, it } from 'vitest'
import type {
  GameMonstersAppearEvent,
  GameCombatUpdateEvent,
  GameLootDroppedEvent,
  GameLevelUpEvent,
  GameInventoryUpdateEvent,
} from '../events'

describe('events types', () => {
  it('should allow GameMonstersAppearEvent', () => {
    const event: GameMonstersAppearEvent = {
      type: 'monsters_appear',
      monsters: [
        {
          id: 1,
          name: 'Goblin',
          type: 'normal',
          level: 1,
          hp: 20,
          max_hp: 20,
        },
      ],
      character: {
        current_hp: 100,
        current_mana: 50,
      },
    }
    expect(event.type).toBe('monsters_appear')
    expect(event.monsters).toHaveLength(1)
    expect(event.character.current_hp).toBe(100)
  })

  it('should allow GameCombatUpdateEvent extending CombatResult', () => {
    const event: GameCombatUpdateEvent = {
      type: 'combat_update',
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
      current_hp: 90,
      current_mana: 45,
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
    expect(event.type).toBe('combat_update')
    expect(event.current_hp).toBe(90)
  })

  it('should allow GameCombatUpdateEvent with optional type', () => {
    const event: GameCombatUpdateEvent = {
      victory: false,
      monster: {
        name: 'Goblin',
        type: 'normal',
        level: 1,
      },
      damage_dealt: 0,
      damage_taken: 100,
      rounds: 5,
      experience_gained: 0,
      copper_gained: 0,
      loot: {},
      character: {
        id: 1,
        user_id: 1,
        name: 'Hero',
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
      },
    }
    expect(event.type).toBeUndefined()
  })

  it('should allow GameLootDroppedEvent with item', () => {
    const event: GameLootDroppedEvent = {
      type: 'loot_dropped',
      item: {
        id: 1,
        character_id: 1,
        definition_id: 1,
        definition: {
          id: 1,
          name: 'Gold',
          type: 'gem',
          base_stats: {},
          required_level: 1,
        },
        quality: 'common',
        stats: {},
        affixes: [],
        is_in_storage: false,
        quantity: 1,
        slot_index: null,
      },
      copper: 50,
      character: {
        current_hp: 100,
        current_mana: 50,
      },
    }
    expect(event.type).toBe('loot_dropped')
    expect(event.item?.definition.name).toBe('Gold')
  })

  it('should allow GameLootDroppedEvent without item', () => {
    const event: GameLootDroppedEvent = {
      type: 'loot_dropped',
      copper: 100,
    }
    expect(event.item).toBeUndefined()
    expect(event.character).toBeUndefined()
  })

  it('should allow GameLevelUpEvent', () => {
    const event: GameLevelUpEvent = {
      type: 'level_up',
      character: {
        id: 1,
        user_id: 1,
        name: 'Hero',
        class: 'warrior',
        level: 2,
        experience: 0,
        copper: 550,
        strength: 10,
        dexterity: 10,
        vitality: 10,
        energy: 10,
        skill_points: 1,
        stat_points: 4,
        current_map_id: null,
        is_fighting: false,
        last_combat_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    }
    expect(event.type).toBe('level_up')
    expect(event.character.level).toBe(2)
  })

  it('should allow GameInventoryUpdateEvent with all fields', () => {
    const event: GameInventoryUpdateEvent = {
      type: 'inventory_update',
      inventory: [],
      storage: [],
      equipment: { weapon: null, helmet: null },
      inventory_size: 50,
      storage_size: 50,
    }
    expect(event.inventory_size).toBe(50)
    expect(event.storage_size).toBe(50)
  })

  it('should allow GameInventoryUpdateEvent with partial fields', () => {
    const event: GameInventoryUpdateEvent = {
      type: 'inventory_update',
    }
    expect(event.inventory).toBeUndefined()
    expect(event.storage).toBeUndefined()
  })
})
