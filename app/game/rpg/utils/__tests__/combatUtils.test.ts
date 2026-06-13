import { describe, expect, it } from 'vitest'
import {
  getPrimaryCombatMonster,
  getPrimaryCombatMonsterId,
  isRenderableCombatMonster,
  normalizeCombatMonsterSlots,
} from '../combatUtils'

describe('combatUtils', () => {
  it('picks the first alive monster', () => {
    const monsters = [
      { id: 1, name: 'Dead', type: 'normal' as const, level: 1, hp: 0, max_hp: 10 },
      { id: 2, name: 'Alive', type: 'normal' as const, level: 1, hp: 5, max_hp: 10 },
    ]

    expect(getPrimaryCombatMonster(monsters)?.name).toBe('Alive')
    expect(getPrimaryCombatMonsterId(monsters)).toBe(2)
  })

  it('ignores backend placeholder monsters', () => {
    const placeholder = { id: 0, name: '', type: 'normal' as const, level: 0, hp: 0, max_hp: 0 }
    const realMonster = {
      id: 3,
      name: 'Pig',
      type: 'normal' as const,
      level: 1,
      hp: 20,
      max_hp: 25,
    }

    expect(isRenderableCombatMonster(placeholder)).toBe(false)
    expect(getPrimaryCombatMonster([placeholder, realMonster])?.name).toBe('Pig')
    expect(getPrimaryCombatMonsterId([placeholder])).toBeUndefined()
  })

  it('normalizes compact monster arrays into fixed slots', () => {
    const monsters = [
      { id: 1, name: 'A', type: 'normal' as const, level: 1, hp: 10, max_hp: 10 },
      { id: 2, name: 'B', type: 'normal' as const, level: 1, hp: 10, max_hp: 10 },
    ]

    const slots = normalizeCombatMonsterSlots(monsters)
    expect(slots).toHaveLength(5)
    expect(slots[0]?.name).toBe('A')
    expect(slots[1]?.name).toBe('B')
    expect(slots[0]?.position).toBe(0)
    expect(slots[1]?.position).toBe(1)
  })

  it('places monsters by position field when provided', () => {
    const monsters = [
      { id: 2, name: 'B', type: 'normal' as const, level: 1, hp: 10, max_hp: 10, position: 2 },
      { id: 1, name: 'A', type: 'normal' as const, level: 1, hp: 10, max_hp: 10, position: 0 },
    ]

    const slots = normalizeCombatMonsterSlots(monsters)
    expect(slots[0]?.name).toBe('A')
    expect(slots[2]?.name).toBe('B')
  })
})
