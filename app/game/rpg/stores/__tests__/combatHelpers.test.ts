import { describe, expect, it } from 'vitest'
import { getCombatLogMonsterName } from '../combatHelpers'
import type { CombatLog, CombatResult } from '../../types'

describe('getCombatLogMonsterName', () => {
  it('should read monster name from API string field', () => {
    const log = { monster: '史莱姆' } as CombatLog
    expect(getCombatLogMonsterName(log)).toBe('史莱姆')
  })

  it('should read monster name from nested object', () => {
    const log = {
      monster: { id: 1, name: 'Goblin', type: 'normal', level: 1 },
    } as CombatResult
    expect(getCombatLogMonsterName(log)).toBe('Goblin')
  })

  it('should fall back to monsters array on websocket payload', () => {
    const log = {
      monster: { name: '', type: 'normal', level: 1 },
      monsters: [{ id: 2, name: '幽暗狼', type: 'normal', level: 5, hp: 100, max_hp: 100 }],
    } as CombatResult
    expect(getCombatLogMonsterName(log)).toBe('幽暗狼')
  })

  it('should return ? when no monster name is available', () => {
    expect(getCombatLogMonsterName({ monster: null } as CombatLog)).toBe('?')
  })
})
