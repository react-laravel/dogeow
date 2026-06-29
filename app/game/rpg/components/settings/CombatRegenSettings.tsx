'use client'

import { useGameStore } from '../../stores/gameStore'

export function CombatRegenSettings() {
  const { character } = useGameStore()

  const vitality = character?.vitality ?? 0
  const energy = character?.energy ?? 0

  return (
    <div className="bg-card border-border rounded-lg border p-3 sm:p-4">
      <div className="mb-3 sm:mb-4">
        <h4 className="text-foreground text-base font-medium sm:text-lg">战斗恢复</h4>
        <p className="text-muted-foreground mt-1 text-xs">
          每回合结束后根据体力与能量自动恢复 HP/MP。
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="bg-muted/50 border-border rounded-lg border p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-foreground text-sm font-medium">生命恢复</span>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              +{vitality} HP / 回合
            </span>
          </div>
          <p className="text-muted-foreground text-xs">恢复量 = 当前体力值（{vitality}）</p>
        </div>

        <div className="bg-muted/50 border-border rounded-lg border p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-foreground text-sm font-medium">法力恢复</span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              +{energy} MP / 回合
            </span>
          </div>
          <p className="text-muted-foreground text-xs">恢复量 = 当前能量值（{energy}）</p>
        </div>
      </div>
    </div>
  )
}
