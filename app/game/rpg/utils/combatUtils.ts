import type { CombatMonster } from '../types'

export function isRenderableCombatMonster(
  monster: CombatMonster | null | undefined
): monster is CombatMonster {
  return Boolean(
    monster &&
    typeof monster.name === 'string' &&
    monster.name.trim().length > 0 &&
    typeof monster.max_hp === 'number' &&
    monster.max_hp > 0
  )
}

export function getPrimaryCombatMonster(
  monsters: (CombatMonster | null)[] | null | undefined
): CombatMonster | null {
  if (!monsters?.length) {
    return null
  }

  const renderableMonsters = monsters.filter(isRenderableCombatMonster)

  for (const monster of monsters) {
    if (isRenderableCombatMonster(monster) && (monster.hp ?? 0) > 0) {
      return monster
    }
  }

  return renderableMonsters[0] ?? null
}

export function getPrimaryCombatMonsterId(
  monsters: (CombatMonster | null)[] | null | undefined
): number | undefined {
  return getPrimaryCombatMonster(monsters)?.id
}
