import { describe, expect, it } from 'vitest'
import { getMonsterStatDisplay } from '../monsterDisplayStats'

describe('getMonsterStatDisplay', () => {
  const definition = {
    level: 2,
    hp_base: 10,
    attack_base: 3,
    defense_base: 4,
    experience_base: 5,
  }

  it('should use scaled definition stats when no live monster', () => {
    expect(getMonsterStatDisplay(null, definition)).toEqual({
      level: 2,
      hp: 10,
      attack: 3,
      defense: 4,
      experience: 5,
    })
  })

  it('should prefer live combat monster stats', () => {
    expect(
      getMonsterStatDisplay(
        { level: 3, max_hp: 22, attack: 7, defense: 5, experience: 10 },
        definition
      )
    ).toEqual({
      level: 3,
      hp: 22,
      attack: 7,
      defense: 5,
      experience: 10,
    })
  })
})
