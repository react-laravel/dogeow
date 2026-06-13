import type { CombatMonster } from '../types'

export const COMBAT_MONSTER_COLS = 5
export const COMBAT_MONSTER_MAX_ROWS = 3

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

/** 将后端怪物列表规范为固定 5 槽位（0-4），避免 filter 压缩数组导致错位重复渲染 */
export function normalizeCombatMonsterSlots(
  monsters: (CombatMonster | null)[] | null | undefined
): (CombatMonster | null)[] {
  const slots: (CombatMonster | null)[] = Array.from({ length: COMBAT_MONSTER_COLS }, () => null)
  if (!monsters?.length) return slots

  for (const raw of monsters) {
    if (!isRenderableCombatMonster(raw)) continue
    const pos = raw.position
    if (typeof pos === 'number' && pos >= 0 && pos < COMBAT_MONSTER_COLS && slots[pos] == null) {
      slots[pos] = raw
    }
  }

  // 兼容被压缩为一维数组、未带 position 的响应
  let nextSlot = 0
  for (const raw of monsters) {
    if (!isRenderableCombatMonster(raw)) continue
    const pos = raw.position
    if (typeof pos === 'number' && pos >= 0 && pos < COMBAT_MONSTER_COLS) continue
    while (nextSlot < COMBAT_MONSTER_COLS && slots[nextSlot] != null) nextSlot++
    if (nextSlot >= COMBAT_MONSTER_COLS) break
    slots[nextSlot] = { ...raw, position: nextSlot }
    nextSlot++
  }

  return slots
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
