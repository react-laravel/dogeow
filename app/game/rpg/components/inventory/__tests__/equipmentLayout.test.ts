import { describe, expect, it } from 'vitest'
import { CHARACTER_PORTRAITS, PAPER_DOLL_SLOTS } from '../equipmentLayout'
import type { CharacterClass, EquipmentSlot } from '../../types'

describe('equipmentLayout', () => {
  describe('CHARACTER_PORTRAITS', () => {
    it('should have portraits for all character classes', () => {
      expect(CHARACTER_PORTRAITS.warrior).toBe('/game/rpg/characters/warrior.jpg')
      expect(CHARACTER_PORTRAITS.mage).toBe('/game/rpg/characters/mage.jpg')
      expect(CHARACTER_PORTRAITS.ranger).toBe('/game/rpg/characters/ranger.jpg')
    })

    it('should have correct paths for each class', () => {
      const classes: CharacterClass[] = ['warrior', 'mage', 'ranger']
      classes.forEach(cls => {
        expect(CHARACTER_PORTRAITS[cls]).toContain(cls)
        expect(CHARACTER_PORTRAITS[cls]).toContain('.jpg')
      })
    })
  })

  describe('PAPER_DOLL_SLOTS', () => {
    it('should have 8 equipment slots', () => {
      expect(PAPER_DOLL_SLOTS).toHaveLength(8)
    })

    it('should include all equipment slots', () => {
      const slots = PAPER_DOLL_SLOTS.map(s => s.slot)
      const expectedSlots: EquipmentSlot[] = [
        'helmet',
        'weapon',
        'gloves',
        'belt',
        'amulet',
        'armor',
        'ring',
        'boots',
      ]
      expectedSlots.forEach(expected => {
        expect(slots).toContain(expected)
      })
    })

    it('should have className for each slot', () => {
      PAPER_DOLL_SLOTS.forEach(slot => {
        expect(slot.className).toBeDefined()
        expect(typeof slot.className).toBe('string')
        expect(slot.className.length).toBeGreaterThan(0)
      })
    })

    it('should have helmet on left column top', () => {
      const helmet = PAPER_DOLL_SLOTS.find(s => s.slot === 'helmet')
      expect(helmet).toBeDefined()
      expect(helmet?.className).toContain('left-2')
      expect(helmet?.className).toContain('top-[13%]')
    })

    it('should have boots on left column bottom', () => {
      const boots = PAPER_DOLL_SLOTS.find(s => s.slot === 'boots')
      expect(boots).toBeDefined()
      expect(boots?.className).toContain('left-2')
      expect(boots?.className).toContain('top-[76%]')
    })

    it('should have amulet on right column top', () => {
      const amulet = PAPER_DOLL_SLOTS.find(s => s.slot === 'amulet')
      expect(amulet).toBeDefined()
      expect(amulet?.className).toContain('right-2')
      expect(amulet?.className).toContain('top-[13%]')
    })

    it('should have belt on right column bottom', () => {
      const belt = PAPER_DOLL_SLOTS.find(s => s.slot === 'belt')
      expect(belt).toBeDefined()
      expect(belt?.className).toContain('right-2')
      expect(belt?.className).toContain('top-[76%]')
    })

    it('should have label for amulet and ring slots', () => {
      const amulet = PAPER_DOLL_SLOTS.find(s => s.slot === 'amulet')
      const ring = PAPER_DOLL_SLOTS.find(s => s.slot === 'ring')
      expect(amulet?.label).toBe('护符')
      expect(ring?.label).toBe('戒指')
    })

    it('should not require label for all slots', () => {
      PAPER_DOLL_SLOTS.forEach(slot => {
        expect(slot.slot).toBeDefined()
        expect(slot.className).toBeDefined()
      })
    })
  })
})
