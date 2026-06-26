'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { post } from '@/lib/api'

interface PotionSettingsResponse {
  character: {
    auto_use_hp_potion: boolean
    auto_use_mp_potion: boolean
  }
}

export function PotionSettings() {
  const { inventory, character, setCharacter } = useGameStore()
  const [autoUseHp, setAutoUseHp] = useState(false)
  const [autoUseMp, setAutoUseMp] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (character) {
      setAutoUseHp(character.auto_use_hp_potion ?? false)
      setAutoUseMp(character.auto_use_mp_potion ?? false)
    }
  }, [character])

  const potions = inventory.filter(item => item.definition?.type === 'potion')

  const updateSettings = async (
    field: 'auto_use_hp_potion' | 'auto_use_mp_potion',
    value: boolean
  ) => {
    if (!character?.id) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { character_id: character.id }
      payload[field] = value
      const response = (await post(
        '/rpg/combat/potion-settings',
        payload
      )) as PotionSettingsResponse
      if (field === 'auto_use_hp_potion') setAutoUseHp(value)
      if (field === 'auto_use_mp_potion') setAutoUseMp(value)
      if (response.character && setCharacter) {
        setCharacter(prev => (prev ? { ...prev, ...response.character } : prev))
      }
    } catch (error) {
      console.error('更新药水设置失败:', error)
    } finally {
      setSaving(false)
    }
  }

  const hpPotions = potions
    .filter(item => item.definition?.sub_type === 'hp')
    .sort(
      (a, b) => (b.definition?.base_stats?.max_hp ?? 0) - (a.definition?.base_stats?.max_hp ?? 0)
    )

  const mpPotions = potions
    .filter(item => item.definition?.sub_type === 'mp')
    .sort(
      (a, b) =>
        (b.definition?.base_stats?.max_mana ?? 0) - (a.definition?.base_stats?.max_mana ?? 0)
    )

  const totalHpPotions = hpPotions.reduce((sum, p) => sum + p.quantity, 0)
  const totalMpPotions = mpPotions.reduce((sum, p) => sum + p.quantity, 0)
  const bestHpRestore = hpPotions[0]?.definition?.base_stats?.max_hp ?? 0
  const bestMpRestore = mpPotions[0]?.definition?.base_stats?.max_mana ?? 0

  return (
    <div className="bg-card border-border rounded-lg border p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <h4 className="text-foreground text-base font-medium sm:text-lg">药品设置</h4>
        {saving && <span className="text-muted-foreground text-xs">保存中...</span>}
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* HP药水设置 */}
        <div className="bg-muted/50 border-border rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-foreground text-sm font-medium">自动使用HP药水</span>
            <button
              onClick={() => updateSettings('auto_use_hp_potion', !autoUseHp)}
              disabled={saving}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 sm:text-sm ${
                autoUseHp ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {autoUseHp ? '已开启' : '已关闭'}
            </button>
          </div>

          <p className="text-muted-foreground text-xs">
            开启后，每回合结束后自动使用HP药水（不会超过最大血量）。
          </p>

          <div className="text-muted-foreground mt-2 text-xs">
            拥有HP药水: {totalHpPotions} 个
            {bestHpRestore > 0 && (
              <span className="ml-2 text-green-600 dark:text-green-400">
                (最高恢复 {bestHpRestore} HP)
              </span>
            )}
          </div>
        </div>

        {/* MP药水设置 */}
        <div className="bg-muted/50 border-border rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-foreground text-sm font-medium">自动使用MP药水</span>
            <button
              onClick={() => updateSettings('auto_use_mp_potion', !autoUseMp)}
              disabled={saving}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 sm:text-sm ${
                autoUseMp ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {autoUseMp ? '已开启' : '已关闭'}
            </button>
          </div>

          <p className="text-muted-foreground text-xs">
            开启后，每回合结束后自动使用MP药水（不会超过最大魔力）。
          </p>

          <div className="text-muted-foreground mt-2 text-xs">
            拥有MP药水: {totalMpPotions} 个
            {bestMpRestore > 0 && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                (最高恢复 {bestMpRestore} MP)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
