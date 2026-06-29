import { describe, expect, it, vi } from 'vitest'
import {
  getEquippedItemFor,
  getEquippedRingItems,
  getInventoryCompareActions,
  handleInventoryCompareAction,
  hasEquippedItemFor,
  isHigherValueThanEquipped,
  shouldShowUpgradeIndicator,
} from '../inventoryEquipmentUtils'
import { createItem } from './testUtils'

describe('inventoryEquipmentUtils', () => {
  it('returns equipped items for matching equipment slots', () => {
    const weapon = createItem({
      id: 11,
      definition: { id: 11, name: 'Sword', type: 'weapon', base_stats: {}, required_level: 1 },
    })
    const ring = createItem({
      id: 12,
      definition: { id: 12, name: 'Ring', type: 'ring', base_stats: {}, required_level: 1 },
    })
    const equipment = { weapon, ring }

    expect(
      getEquippedItemFor(
        equipment,
        createItem({
          definition: { id: 21, name: 'Axe', type: 'weapon', base_stats: {}, required_level: 1 },
        })
      )
    ).toBe(weapon)
    expect(
      getEquippedItemFor(
        equipment,
        createItem({
          definition: { id: 22, name: 'Band', type: 'ring', base_stats: {}, required_level: 1 },
        })
      )
    ).toBe(ring)
    expect(
      getEquippedItemFor(
        equipment,
        createItem({
          definition: { id: 23, name: 'Gem', type: 'gem', base_stats: {}, required_level: 1 },
        })
      )
    ).toBeNull()
  })

  it('reports whether matching equipment exists', () => {
    const equipment = {
      weapon: createItem({
        id: 31,
        definition: { id: 31, name: 'Sword', type: 'weapon', base_stats: {}, required_level: 1 },
      }),
    }

    expect(
      hasEquippedItemFor(
        equipment,
        createItem({
          definition: { id: 32, name: 'Axe', type: 'weapon', base_stats: {}, required_level: 1 },
        })
      )
    ).toBe(true)
    expect(
      hasEquippedItemFor(
        equipment,
        createItem({
          definition: { id: 33, name: 'Boots', type: 'boots', base_stats: {}, required_level: 1 },
        })
      )
    ).toBe(false)
  })

  it('detects when inventory item unit sell price exceeds equipped item', () => {
    const equipped = createItem({ id: 35, sell_price: 100 })
    const better = createItem({ id: 36, sell_price: 150 })
    const worse = createItem({ id: 37, sell_price: 80 })

    expect(isHigherValueThanEquipped(better, equipped)).toBe(true)
    expect(isHigherValueThanEquipped(worse, equipped)).toBe(false)
    expect(isHigherValueThanEquipped(better, null)).toBe(true)
  })

  it('does not show upgrade indicator for gems', () => {
    const gem = createItem({
      id: 39,
      sell_price: 999,
      definition: { id: 39, name: 'Ruby', type: 'gem', base_stats: {}, required_level: 1 },
    })
    const weapon = createItem({
      id: 40,
      sell_price: 150,
      definition: { id: 40, name: 'Sword', type: 'weapon', base_stats: {}, required_level: 1 },
    })

    expect(shouldShowUpgradeIndicator(gem, null)).toBe(false)
    expect(shouldShowUpgradeIndicator(weapon, null)).toBe(true)
  })

  it('returns ring items as an array for compare rendering', () => {
    const ring = createItem({
      id: 41,
      definition: { id: 41, name: 'Ring', type: 'ring', base_stats: {}, required_level: 1 },
    })

    expect(getEquippedRingItems({ ring })).toEqual([ring])
    expect(getEquippedRingItems({})).toEqual([])
  })

  it('builds compare actions based on socket capabilities', () => {
    const item = createItem({ id: 51 })

    expect(
      getInventoryCompareActions(item, {
        canSocket: () => false,
        canUnsocket: () => false,
      })
    ).toEqual(['equip', 'store', 'sell'])

    expect(
      getInventoryCompareActions(item, {
        canSocket: () => true,
        canUnsocket: () => true,
      })
    ).toEqual(['equip', 'store', 'sell', 'socket', 'unsocket'])
  })

  it('dispatches compare actions to the matching handler', () => {
    const item = createItem({ id: 61 })
    const handlers = {
      onEquip: vi.fn(),
      onMoveToStorage: vi.fn(),
      onSell: vi.fn(),
      onSocket: vi.fn(),
      onUnsocket: vi.fn(),
    }

    handleInventoryCompareAction('equip', item, handlers)
    handleInventoryCompareAction('store', item, handlers)
    handleInventoryCompareAction('sell', item, handlers)
    handleInventoryCompareAction('socket', item, handlers)
    handleInventoryCompareAction('unsocket', item, handlers)

    expect(handlers.onEquip).toHaveBeenCalledWith(item)
    expect(handlers.onMoveToStorage).toHaveBeenCalledWith(item)
    expect(handlers.onSell).toHaveBeenCalledWith(item)
    expect(handlers.onSocket).toHaveBeenCalledWith(item)
    expect(handlers.onUnsocket).toHaveBeenCalledWith(item)
  })
})
