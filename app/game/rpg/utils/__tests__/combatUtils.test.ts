import { describe, expect, it } from 'vitest'
import {
  getPrimaryCombatMonster,
  getPrimaryCombatMonsterId,
  isRenderableCombatMonster,
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
})
