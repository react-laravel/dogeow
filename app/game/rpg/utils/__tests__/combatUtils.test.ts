import { describe, expect, it } from 'vitest'
import { getPrimaryCombatMonster, getPrimaryCombatMonsterId } from '../combatUtils'

describe('combatUtils', () => {
  it('picks the first alive monster', () => {
    const monsters = [
      { id: 1, name: 'Dead', type: 'normal' as const, level: 1, hp: 0, max_hp: 10 },
      { id: 2, name: 'Alive', type: 'normal' as const, level: 1, hp: 5, max_hp: 10 },
    ]

    expect(getPrimaryCombatMonster(monsters)?.name).toBe('Alive')
    expect(getPrimaryCombatMonsterId(monsters)).toBe(2)
  })
})
