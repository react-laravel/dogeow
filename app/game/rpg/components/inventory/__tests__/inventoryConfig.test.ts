import { describe, expect, it } from 'vitest'
import { INVENTORY_CATEGORIES, RECYCLE_QUALITIES } from '../inventoryConfig'

describe('inventoryConfig', () => {
  describe('INVENTORY_CATEGORIES', () => {
    it('should have 6 categories', () => {
      expect(INVENTORY_CATEGORIES).toHaveLength(6)
    })

    it('should have correct category structure', () => {
      INVENTORY_CATEGORIES.forEach(category => {
        expect(category.id).toBeDefined()
        expect(category.emoji).toBeDefined()
        expect(category.label).toBeDefined()
        expect(category.types).toBeDefined()
        expect(Array.isArray(category.types)).toBe(true)
        expect(category.types.length).toBeGreaterThan(0)
      })
    })

    it('should have weapon category with weapon type', () => {
      const weapon = INVENTORY_CATEGORIES.find(c => c.id === 'weapon')
      expect(weapon).toBeDefined()
      expect(weapon?.types).toEqual(['weapon'])
    })

    it('should have armor category with helmet armor belt types', () => {
      const armor = INVENTORY_CATEGORIES.find(c => c.id === 'armor')
      expect(armor).toBeDefined()
      expect(armor?.types).toEqual(['helmet', 'armor', 'belt'])
    })

    it('should have accessory category with ring and amulet types', () => {
      const accessory = INVENTORY_CATEGORIES.find(c => c.id === 'accessory')
      expect(accessory).toBeDefined()
      expect(accessory?.types).toEqual(['ring', 'amulet'])
    })

    it('should have gem category', () => {
      const gem = INVENTORY_CATEGORIES.find(c => c.id === 'gem')
      expect(gem).toBeDefined()
      expect(gem?.types).toEqual(['gem'])
    })

    it('should have unique category ids', () => {
      const ids = INVENTORY_CATEGORIES.map(c => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(INVENTORY_CATEGORIES.length)
    })
  })

  describe('RECYCLE_QUALITIES', () => {
    it('should include all 5 quality levels', () => {
      expect(RECYCLE_QUALITIES).toHaveLength(5)
      expect(RECYCLE_QUALITIES).toContain('common')
      expect(RECYCLE_QUALITIES).toContain('magic')
      expect(RECYCLE_QUALITIES).toContain('rare')
      expect(RECYCLE_QUALITIES).toContain('legendary')
      expect(RECYCLE_QUALITIES).toContain('mythic')
    })

    it('should be ordered from lowest to highest quality', () => {
      expect(RECYCLE_QUALITIES[0]).toBe('common')
      expect(RECYCLE_QUALITIES[4]).toBe('mythic')
    })
  })
})
