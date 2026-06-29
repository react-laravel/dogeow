import { describe, expect, it } from 'vitest'
import type {
  ItemQuality,
  ItemType,
  EquipmentSlot,
  ItemDefinition,
  GameItem,
  Equipment,
} from '../item'
import { QUALITY_COLORS, QUALITY_NAMES, SLOT_NAMES } from '../item'

describe('item types', () => {
  it('should have correct ItemQuality values', () => {
    const qualities: ItemQuality[] = ['common', 'magic', 'rare', 'legendary', 'mythic']
    qualities.forEach(q => {
      expect(QUALITY_COLORS[q]).toBeDefined()
      expect(QUALITY_NAMES[q]).toBeDefined()
    })
  })

  it('should have correct quality colors', () => {
    expect(QUALITY_COLORS.common).toBe('#9ca3af')
    expect(QUALITY_COLORS.magic).toBe('#6888ff')
    expect(QUALITY_COLORS.rare).toBe('#ffcc00')
    expect(QUALITY_COLORS.legendary).toBe('#ff8000')
    expect(QUALITY_COLORS.mythic).toBe('#00ff00')
  })

  it('should have correct quality names', () => {
    expect(QUALITY_NAMES.common).toBe('普通')
    expect(QUALITY_NAMES.magic).toBe('魔法')
    expect(QUALITY_NAMES.rare).toBe('稀有')
    expect(QUALITY_NAMES.legendary).toBe('传奇')
    expect(QUALITY_NAMES.mythic).toBe('神话')
  })

  it('should have correct slot names', () => {
    expect(SLOT_NAMES.weapon).toBe('武器')
    expect(SLOT_NAMES.helmet).toBe('头盔')
    expect(SLOT_NAMES.armor).toBe('盔甲')
    expect(SLOT_NAMES.gloves).toBe('手套')
    expect(SLOT_NAMES.boots).toBe('靴子')
    expect(SLOT_NAMES.belt).toBe('腰带')
    expect(SLOT_NAMES.ring).toBe('戒指')
    expect(SLOT_NAMES.amulet).toBe('护符')
  })

  it('should allow ItemDefinition with gem_stats', () => {
    const def: ItemDefinition = {
      id: 1,
      name: 'Ruby',
      type: 'gem',
      base_stats: { attack: 5 },
      gem_stats: { attack: 3, crit_rate: 0.02 },
      required_level: 1,
      buy_price: 100,
    }
    expect(def.gem_stats).toEqual({ attack: 3, crit_rate: 0.02 })
  })

  it('should allow ItemDefinition without optional fields', () => {
    const def: ItemDefinition = {
      id: 1,
      name: 'Sword',
      type: 'weapon',
      base_stats: { attack: 10 },
      required_level: 1,
    }
    expect(def.sub_type).toBeUndefined()
    expect(def.icon).toBeUndefined()
    expect(def.buy_price).toBeUndefined()
  })

  it('should allow GameItem with gems', () => {
    const item: GameItem = {
      id: 1,
      character_id: 1,
      definition_id: 1,
      definition: {
        id: 1,
        name: 'Sword',
        type: 'weapon',
        base_stats: { attack: 10 },
        required_level: 1,
      },
      quality: 'rare',
      stats: { attack: 15 },
      affixes: [{ strength: 3 }],
      is_in_storage: false,
      quantity: 1,
      slot_index: 0,
      sell_price: 200,
      sockets: 2,
      gems: [
        {
          id: 1,
          socket_index: 0,
          gemDefinition: {
            id: 10,
            name: 'Ruby',
            type: 'gem',
            base_stats: { attack: 3 },
            required_level: 1,
          },
        },
      ],
    }
    expect(item.gems).toHaveLength(1)
    expect(item.gems![0].gemDefinition.name).toBe('Ruby')
  })

  it('should allow GameItem without optional fields', () => {
    const item: GameItem = {
      id: 1,
      character_id: 1,
      definition_id: 1,
      definition: {
        id: 1,
        name: 'Consumable',
        type: 'gem',
        base_stats: { max_hp: 50 },
        required_level: 1,
      },
      quality: 'common',
      stats: {},
      affixes: [],
      is_in_storage: false,
      quantity: 5,
      slot_index: null,
    }
    expect(item.sell_price).toBeUndefined()
    expect(item.sockets).toBeUndefined()
    expect(item.gems).toBeUndefined()
  })

  it('should allow Equipment', () => {
    const equipment: Equipment = {
      slot: 'weapon',
      item: {
        id: 1,
        character_id: 1,
        definition_id: 1,
        definition: {
          id: 1,
          name: 'Sword',
          type: 'weapon',
          base_stats: { attack: 10 },
          required_level: 1,
        },
        quality: 'rare',
        stats: { attack: 15 },
        affixes: [],
        is_in_storage: false,
        quantity: 1,
        slot_index: 0,
      },
    }
    expect(equipment.slot).toBe('weapon')
    expect(equipment.item?.definition.name).toBe('Sword')
  })

  it('should allow Equipment with null item', () => {
    const equipment: Equipment = {
      slot: 'helmet',
      item: null,
    }
    expect(equipment.item).toBeNull()
  })

  it('should support all ItemType values', () => {
    const types: ItemType[] = [
      'weapon',
      'helmet',
      'armor',
      'gloves',
      'boots',
      'belt',
      'ring',
      'amulet',
      'gem',
    ]
    types.forEach(type => {
      const def: ItemDefinition = {
        id: 1,
        name: 'Test',
        type,
        base_stats: {},
        required_level: 1,
      }
      expect(def.type).toBe(type)
    })
  })

  it('should support all EquipmentSlot values', () => {
    const slots: EquipmentSlot[] = [
      'weapon',
      'helmet',
      'armor',
      'gloves',
      'boots',
      'belt',
      'ring',
      'amulet',
    ]
    slots.forEach(slot => {
      expect(SLOT_NAMES[slot]).toBeDefined()
    })
  })
})
