'use client'

import type { CharacterSkill, SkillUsedEntry } from '../../types'
import { Check } from 'lucide-react'
import { SkillIcon } from '../shared/SkillIcon'
import styles from '../../rpg.module.css'

export type SkillBarLayout = 'row' | 'wrap'

/** 战斗技能栏：显示主动技能图标、回合冷却、点击启用/关闭 */
export function BattleSkillBar({
  activeSkills,
  skillsUsed,
  skillCooldowns,
  enabledSkillIds,
  onSkillToggle,
  disabled,
  layout = 'row',
}: {
  activeSkills: CharacterSkill[]
  skillsUsed: SkillUsedEntry[] | undefined
  skillCooldowns: Record<number, number>
  enabledSkillIds: number[]
  onSkillToggle: (skillId: number) => void
  disabled?: boolean
  layout?: SkillBarLayout
}) {
  if (activeSkills.length === 0) return null
  const usedSkillIds = new Set(skillsUsed?.map(skill => skill.skill_id) ?? [])

  return (
    <div
      className={
        layout === 'row'
          ? 'flex flex-nowrap items-start gap-2 overflow-x-auto overscroll-x-contain pb-1'
          : 'flex flex-wrap items-start gap-2'
      }
    >
      {activeSkills.map(cs => {
        const def = cs.skill
        // 剩余冷却回合数
        const remainingRounds = skillCooldowns[def.id] ?? 0
        const onCooldown = remainingRounds > 0
        const enabled = enabledSkillIds.includes(def.id) && !disabled
        const wasUsed = usedSkillIds.has(def.id)
        const manaCost = def.mana_cost + (cs.level - 1) * (def.mana_cost_per_level ?? 0)
        const costLabel = manaCost > 0 ? ` | 消耗 ${manaCost} MP` : ''
        const buttonContent = (
          <>
            <div className="relative">
              <SkillIcon icon={def.icon} effectKey={def.effect_key} name={def.name} />
              {enabled && !onCooldown && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              )}
              {onCooldown && (
                <div
                  className={`${styles['skill-cooldown']} absolute inset-0 flex items-center justify-center overflow-hidden rounded bg-black/65`}
                  aria-hidden
                >
                  <span className="relative z-10 text-sm font-bold text-white drop-shadow">
                    {remainingRounds}
                  </span>
                </div>
              )}
            </div>
            <span className="text-foreground w-full truncate text-center text-[10px] font-medium sm:text-xs">
              {def.name}
            </span>
            <span className="text-muted-foreground h-3 text-[9px] leading-3 tabular-nums">
              {manaCost > 0 ? `${manaCost} MP` : '无消耗'}
            </span>
          </>
        )
        const btnClass = [
          'focus-visible:ring-ring relative flex h-[5.25rem] w-[4.25rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border px-1.5 py-1 transition-[background-color,border-color,box-shadow,filter,opacity,transform] duration-150 focus:outline-none focus-visible:ring-2 outline-offset-0 active:scale-[0.97]',
          enabled
            ? 'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/15'
            : 'border-border/60 bg-muted/20 grayscale opacity-65 hover:bg-muted/40 hover:opacity-90',
          wasUsed ? styles['skill-triggered'] : '',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')
        return (
          <button
            key={`${cs.id}-${wasUsed ? (skillsUsed?.find(skill => skill.skill_id === def.id)?.round ?? 'used') : 'idle'}`}
            type="button"
            className={btnClass}
            aria-pressed={enabled}
            aria-label={`${def.name}，${enabled ? '已启用' : '已关闭'}${onCooldown ? `，冷却 ${remainingRounds} 回合` : ''}`}
            title={
              enabled
                ? `${def.name} 已启用（再点关闭）${costLabel}`
                : `${def.name} 点击启用${costLabel}`
            }
            onClick={() => onSkillToggle(def.id)}
          >
            {buttonContent}
          </button>
        )
      })}
    </div>
  )
}
