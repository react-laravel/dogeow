'use client'

import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../stores/gameStore'
import { CopperDisplay } from './CopperDisplay'
import { CircularProgress } from './CircularProgress'

/** 顶部状态栏：独立订阅 HP/MP/经验，避免战斗推送触发整页重渲染 */
export function RpgStatusHeader() {
  const { character, combatStats, currentHp, currentMana, experienceTable } = useGameStore(
    useShallow(s => ({
      character: s.character,
      combatStats: s.combatStats,
      currentHp: s.currentHp,
      currentMana: s.currentMana,
      experienceTable: s.experienceTable,
    }))
  )

  if (!character || !combatStats) return null

  const expToNext = experienceTable?.[character.level + 1] ?? (character.level + 1) * 5000
  const expPercent =
    expToNext > 0 ? Math.max(0, Math.min(100, (character.experience / expToNext) * 100)) : 0

  return (
    <>
      <div className="flex w-full items-center gap-2 text-xs sm:gap-3 sm:text-sm">
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-foreground text-xs font-medium sm:text-sm">
            Lv.{character.level}
          </span>
          <span className="self-center text-yellow-600 dark:text-yellow-400">
            <CopperDisplay copper={character.copper} size="sm" maxParts={3} />
          </span>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <div className="flex items-center gap-1">
            <CircularProgress
              percent={
                combatStats.max_hp > 0
                  ? ((currentHp ?? combatStats.max_hp) / combatStats.max_hp) * 100
                  : 0
              }
              color="red"
            />
            <span className="text-xs text-red-500 sm:text-sm dark:text-red-400">
              {currentHp ?? combatStats.max_hp}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <CircularProgress
              percent={
                combatStats.max_mana > 0
                  ? ((currentMana ?? combatStats.max_mana) / combatStats.max_mana) * 100
                  : 0
              }
              color="blue"
            />
            <span className="text-xs text-blue-500 sm:text-sm dark:text-blue-400">
              {currentMana ?? combatStats.max_mana}
            </span>
          </div>
        </div>
        <div className="flex shrink-0">
          <span className="text-xs text-amber-500 tabular-nums sm:text-sm dark:text-amber-400">
            {expPercent.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="bg-muted absolute right-0 bottom-0 left-0 h-px overflow-hidden">
        <div
          className="h-full min-w-0 transition-[width] duration-300"
          style={{
            width: `${expPercent}%`,
            backgroundColor: expPercent > 0 ? '#f59e0b' : 'transparent',
          }}
        />
      </div>
    </>
  )
}
