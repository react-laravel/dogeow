import type { CombatMonster } from '../types'

export function getPrimaryCombatMonster(
  monsters: (CombatMonster | null)[] | null | undefined
): CombatMonster | null {
  if (!monsters?.length) {
    return null
  }

  for (const monster of monsters) {
    if (monster && (monster.hp ?? 0) > 0) {
      return monster
    }
  }

  for (const monster of monsters) {
    if (monster) {
      return monster
    }
  }

  return null
}

export function getPrimaryCombatMonsterId(
  monsters: (CombatMonster | null)[] | null | undefined
): number | undefined {
  return getPrimaryCombatMonster(monsters)?.id
}
