'use client'

import { type ActiveMercenary, type CombatMonster, type SkillUsedEntry } from '../../types'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { MonsterIcon } from './MonsterIcon'
import { MonsterGroup } from './MonsterGroup'
import { SkillEffect, type SkillEffectType } from './effects'
import { soundManager } from '../../utils/soundManager'
import { getSkillSoundDuration } from '../../utils/skillSoundRegistry'
import styles from '../../rpg.module.css'

/** 战斗对阵：上侧怪物（支持多只），下侧用户，中间 VS 可点击开始/停止挂机 */
export function BattleArena({
  character,
  combatStats,
  currentHp,
  currentMana,
  monster,
  monsterId,
  monsterHpBeforeRound,
  monsters,
  isFighting,
  isLoading,
  skillUsed,
  skillTargetPositions,
  mercenary,
  combatLogId,
  onRoundVisualSettled,
}: {
  character: { name: string; class: string; level: number } | null
  combatStats: { max_hp: number; max_mana: number } | null
  currentHp: number | null
  currentMana: number | null
  monster: {
    name: string
    type: string
    level: number
    icon?: string | null
    hp?: number
    max_hp?: number
  } | null
  monsterId?: number
  monsterHpBeforeRound?: number
  monsters?: (CombatMonster | null)[]
  isFighting: boolean
  isLoading: boolean
  skillUsed?: SkillUsedEntry | null
  skillTargetPositions?: number[]
  mercenary?: ActiveMercenary | null
  combatLogId?: number | null
  onRoundVisualSettled?: () => void
}) {
  const finalMonsterHp = monster?.hp ?? 0
  const maxHp = monster?.max_hp ?? 0
  const [displayMonsterHp, setDisplayMonsterHp] = useState<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingFinalHpRef = useRef<number>(finalMonsterHp)
  const lastSkillUsedRef = useRef<SkillUsedEntry | null>(null)
  const lastPlayedSkillSoundRef = useRef<SkillUsedEntry | null>(null)
  const skillAnimationCompletedRef = useRef(false)
  const lastNotifiedLogIdRef = useRef<number | null>(null)

  const notifyRoundVisualSettled = useCallback(() => {
    if (!onRoundVisualSettled) return
    if (combatLogId != null && combatLogId === lastNotifiedLogIdRef.current) return
    if (combatLogId != null) lastNotifiedLogIdRef.current = combatLogId
    onRoundVisualSettled()
  }, [combatLogId, onRoundVisualSettled])

  // 检测怪物死亡
  const isMonsterDead = finalMonsterHp <= 0
  const hpPercent = combatStats?.max_hp
    ? Math.min(100, Math.max(0, ((currentHp ?? 0) / combatStats.max_hp) * 100))
    : 0
  const manaPercent = combatStats?.max_mana
    ? Math.min(100, Math.max(0, ((currentMana ?? 0) / combatStats.max_mana) * 100))
    : 0

  const hasValidMonsters = monsters?.some(m => m != null) ?? false

  // 技能特效类型：直接使用后端返回的 effect_key
  // 注意：只列出已实现特效组件的 key（heal 无特效组件，列入会导致扣血显示一直被挂起）
  const computedSkillEffect = useMemo((): SkillEffectType | null => {
    if (!skillUsed?.effect_key) return null
    const key = skillUsed.effect_key
    const valid: SkillEffectType[] = [
      'meteor',
      'meteor-storm',
      'fireball',
      'ice-arrow',
      'ice-age',
      'blackhole',
      'lightning',
      'chain-lightning',
    ]
    return valid.includes(key as SkillEffectType) ? (key as SkillEffectType) : null
  }, [skillUsed])

  // 用 skill_id + round 识别技能回合，避免 combatResult 新对象引用导致反复更新
  const skillRoundKey = useMemo(() => {
    if (!skillUsed || !computedSkillEffect) return null
    return `${skillUsed.skill_id}:${skillUsed.round ?? 'na'}:${computedSkillEffect}`
  }, [skillUsed, computedSkillEffect])
  const lastSkillRoundKeyRef = useRef<string | null>(null)
  const [settledSkillRoundKey, setSettledSkillRoundKey] = useState<string | null>(null)
  const [monsterAppearBlocking, setMonsterAppearBlocking] = useState(false)
  const skillRoundPending = Boolean(skillRoundKey && settledSkillRoundKey !== skillRoundKey)
  const deferDamageDisplay = skillRoundPending || monsterAppearBlocking
  const showDamageAndHp = !deferDamageDisplay
  const activeSkillEffect = skillRoundPending && !monsterAppearBlocking ? computedSkillEffect : null

  const handleAppearActiveChange = useCallback((active: boolean) => {
    setMonsterAppearBlocking(active)
  }, [])

  useLayoutEffect(() => {
    if (!skillRoundKey) {
      lastSkillRoundKeyRef.current = null
      lastSkillUsedRef.current = null
      // 回合已推进且本回合无技能：上一回合特效若仍在播，视为已结算，
      // 其迟到的 onComplete 不再重复播命中音/改血量
      skillAnimationCompletedRef.current = true
      return
    }

    if (skillRoundKey !== lastSkillRoundKeyRef.current) {
      lastSkillRoundKeyRef.current = skillRoundKey
      lastSkillUsedRef.current = skillUsed ?? null
      skillAnimationCompletedRef.current = false
    }
  }, [skillRoundKey, skillUsed])

  // 有视觉特效的技能：音效与特效同时开始；无特效技能：与扣血显示同步
  useEffect(() => {
    if (!skillUsed || monsterAppearBlocking) return
    if (skillUsed === lastPlayedSkillSoundRef.current) return

    const hasVisualEffect = Boolean(computedSkillEffect)
    if (hasVisualEffect) {
      if (!activeSkillEffect) return
    } else if (!showDamageAndHp) {
      return
    }

    lastPlayedSkillSoundRef.current = skillUsed
    soundManager.playSkill(skillUsed)
  }, [skillUsed, monsterAppearBlocking, computedSkillEffect, activeSkillEffect, showDamageAndHp])

  // 多怪物：延迟显示时传扣血前数据
  const displayMonsters = useMemo(() => {
    const list = monsters ?? []
    if (!deferDamageDisplay || list.length === 0) return list
    return list.map(m => {
      if (m == null) return m
      const rawTaken = (m as CombatMonster & { damage_taken?: number }).damage_taken ?? 0
      // 后端用 -1 表示未受击，只有 >=0 才是实际受到的伤害，用于还原扣血前血量
      const taken = rawTaken >= 0 ? rawTaken : 0
      const beforeHp = Math.min(m.max_hp ?? 99999, (m.hp ?? 0) + taken)
      return { ...m, hp: beforeHp, damage_taken: undefined } as typeof m
    })
  }, [monsters, deferDamageDisplay])

  // 有技能回合且未到「可显示扣血」时，强制用扣血前血量，避免首帧就显示 finalMonsterHp
  const hasSkillThisRound = Boolean(skillUsed && computedSkillEffect)
  const effectiveMonsterHp =
    hasSkillThisRound && deferDamageDisplay
      ? (monsterHpBeforeRound ?? displayMonsterHp ?? maxHp ?? 0)
      : (displayMonsterHp ?? monsterHpBeforeRound ?? finalMonsterHp)

  // 怪物血量显示：有技能动画时等 onComplete 后再扣血，否则 150ms 后扣血
  useEffect(() => {
    pendingFinalHpRef.current = finalMonsterHp
    if (monster == null || maxHp <= 0) {
      const raf = requestAnimationFrame(() => setDisplayMonsterHp(null))
      rafRef.current = raf
      return () => cancelAnimationFrame(raf)
    }
    const before = monsterHpBeforeRound ?? finalMonsterHp
    const raf = requestAnimationFrame(() => {
      setDisplayMonsterHp(before)
      if (before !== finalMonsterHp) {
        const hasSkillEffect = Boolean(skillUsed && computedSkillEffect)
        if (!hasSkillEffect) {
          const t = setTimeout(() => setDisplayMonsterHp(finalMonsterHp), 150)
          timeoutRef.current = t
        }
      }
    })
    rafRef.current = raf
    return () => {
      cancelAnimationFrame(raf)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [
    monster?.name,
    monster?.level,
    finalMonsterHp,
    maxHp,
    monsterHpBeforeRound,
    monster,
    skillUsed,
    computedSkillEffect,
  ])

  // 根据怪物位置计算目标位置（单目标）
  const computedTargetPos = useMemo(() => {
    if (!skillTargetPositions || skillTargetPositions.length === 0) {
      return { x: 0.5, y: 0.25 }
    }
    const pos = skillTargetPositions[0]
    const x = 0.1 + pos * 0.2
    return { x, y: 0.25 }
  }, [skillTargetPositions])

  // 多目标位置（用于冰河世纪、连锁闪电等）
  const computedTargetPositions = useMemo(() => {
    if (!skillTargetPositions || skillTargetPositions.length === 0) {
      return [{ x: 0.5, y: 0.25 }]
    }
    return skillTargetPositions.map(pos => ({
      x: 0.1 + pos * 0.2,
      y: 0.25,
    }))
  }, [skillTargetPositions])

  const shouldUseMultiTargetEffect =
    activeSkillEffect === 'ice-age' ||
    activeSkillEffect === 'chain-lightning' ||
    (activeSkillEffect === 'fireball' && skillUsed?.target_type === 'all')

  /** 结算本回合：显示扣血与最终血量，并在视觉命中时播放命中音效 */
  const settleRound = useCallback(() => {
    if (skillAnimationCompletedRef.current) return
    skillAnimationCompletedRef.current = true
    setSettledSkillRoundKey(lastSkillRoundKeyRef.current)
    setDisplayMonsterHp(pendingFinalHpRef.current)
    // 命中音效与视觉命中对齐（技能回合的 combat_hit 不在 store 收到推送时播放）
    soundManager.play('combat_hit')
    notifyRoundVisualSettled()
  }, [notifyRoundVisualSettled])

  /** 技能视觉命中时调用（如冰箭击中），提前显示扣血，不等尾效播完 */
  const handleHit = settleRound

  const handleSkillComplete = useCallback(() => {
    settleRound()
  }, [settleRound])

  // 技能音效结束时对齐结算扣血，避免音效播完还要再等特效尾段
  useEffect(() => {
    if (!activeSkillEffect || !skillUsed) return
    const durationMs = Math.round((getSkillSoundDuration(skillUsed) ?? 0.55) * 1000)
    const syncTimer = setTimeout(() => settleRound(), durationMs)
    return () => clearTimeout(syncTimer)
  }, [activeSkillEffect, skillUsed, settleRound])

  // 看门狗：后端约 3 秒一回合，特效若超时未回调 onComplete（卡帧/标签页后台等），
  // 强制结算，保证下一回合数据到达前 UI 已经是最终状态
  useEffect(() => {
    if (!activeSkillEffect || !skillRoundKey) return
    const watchdog = setTimeout(handleSkillComplete, 2600)
    return () => clearTimeout(watchdog)
  }, [activeSkillEffect, skillRoundKey, handleSkillComplete])

  // 无视觉技能特效的回合：出现动画结束后展示扣血，再写入战斗日志
  useEffect(() => {
    if (monsterAppearBlocking || deferDamageDisplay) return
    if (skillUsed && computedSkillEffect) return
    if (combatLogId == null) return
    if (combatLogId === lastNotifiedLogIdRef.current) return

    const timer = setTimeout(() => {
      soundManager.play('combat_hit')
      notifyRoundVisualSettled()
    }, 150)

    return () => clearTimeout(timer)
  }, [
    monsterAppearBlocking,
    deferDamageDisplay,
    skillUsed,
    computedSkillEffect,
    combatLogId,
    notifyRoundVisualSettled,
  ])

  // 冰河世纪作为「地面层」在怪物背后，其它技能在顶层
  const effectLayerZ = activeSkillEffect === 'ice-age' ? 'z-0' : 'z-10'

  return (
    <div className="absolute inset-0 isolate flex flex-col items-stretch">
      {/* 技能特效层：冰河世纪在底层（地面冰面，延伸到怪物身后），其它技能在顶层 */}
      {activeSkillEffect && skillRoundKey && (
        <SkillEffect
          key={skillRoundKey}
          type={activeSkillEffect}
          active={true}
          targetPosition={computedTargetPos}
          targetPositions={shouldUseMultiTargetEffect ? computedTargetPositions : undefined}
          onComplete={handleSkillComplete}
          onHit={handleHit}
          className={`absolute inset-0 ${effectLayerZ}`}
        />
      )}

      {/* 内容层：怪物、VS、玩家叠在特效之上，形成立体场景 */}
      <div className="relative z-10 flex flex-1 flex-col min-h-0">
        {/* 上侧：怪物区限高最多三排，给下方角色留出空间 */}
        <div className="flex max-h-[min(46%,13.5rem)] flex-none flex-col items-center justify-end gap-1 overflow-hidden px-2 pt-4 sm:max-h-[min(48%,15rem)] sm:px-3 sm:pt-6">
          {!isLoading && isFighting && hasValidMonsters ? (
            <MonsterGroup
              monsters={displayMonsters}
              skillUsed={skillUsed}
              skillTargetPositions={skillTargetPositions}
              showDamageAndHp={showDamageAndHp}
              onAppearActiveChange={handleAppearActiveChange}
            />
          ) : !isLoading && isFighting && monster ? (
            <div className={isMonsterDead ? styles['monster-death'] : ''}>
              <MonsterIcon key={monsterId} icon={monster.icon} name={monster.name} size="lg" />
            </div>
          ) : isFighting && isLoading ? (
            <div className="text-muted-foreground flex h-20 w-20 items-center justify-center text-xs sm:h-24 sm:w-24 sm:text-sm">
              进入战斗中
            </div>
          ) : (
            <div className="h-20 w-20 sm:h-24 sm:w-24" />
          )}
          {!isLoading && isFighting && !hasValidMonsters && !monster && !monsterId && (
            <div className="text-muted-foreground flex-1 text-xs">战斗中</div>
          )}
        </div>

        {/* 下侧：用户与雇佣兵 */}
        <div className="mt-auto flex shrink-0 items-end justify-center gap-3 p-3 sm:gap-4 sm:p-4">
          {mercenary && <MercenaryCombatCard mercenary={mercenary} />}
          <div className="flex flex-col items-center gap-2">
            <div className="bg-primary/20 text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold sm:h-16 sm:w-16 sm:text-2xl">
              {character?.name?.charAt(0) ?? '?'}
            </div>
            {combatStats && (
              <div className="w-full max-w-[140px] space-y-1 sm:max-w-[160px]">
                <div className="text-muted-foreground flex justify-between text-[10px] sm:text-xs">
                  <span>HP</span>
                  <span>
                    {currentHp ?? 0} / {combatStats.max_hp}
                  </span>
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-red-500 transition-[width] duration-300"
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
                <div className="text-muted-foreground flex justify-between text-[10px] sm:text-xs">
                  <span>MP</span>
                  <span>
                    {currentMana ?? 0} / {combatStats.max_mana}
                  </span>
                </div>
                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-[width] duration-300"
                    style={{ width: `${manaPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MercenaryCombatCard({ mercenary }: { mercenary: ActiveMercenary }) {
  const hpPercent =
    mercenary.stats.max_hp > 0
      ? Math.min(100, Math.max(0, (mercenary.current_hp / mercenary.stats.max_hp) * 100))
      : 0
  const attacked = (mercenary.last_attack?.damage ?? 0) > 0

  return (
    <div
      className={`flex w-24 flex-col items-center gap-2 text-white sm:w-28 ${
        attacked ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.75)]' : ''
      }`}
      title={attacked ? `攻击造成 ${mercenary.last_attack?.damage ?? 0} 伤害` : undefined}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-lg font-bold sm:h-14 sm:w-14">
        {mercenary.icon ?? '🛡️'}
      </div>
      <div className="w-full max-w-[140px] space-y-1">
        <div className="text-muted-foreground flex justify-between gap-1 text-[10px] sm:text-xs">
          <span className="truncate">{mercenary.name}</span>
          <span className="shrink-0">
            {mercenary.current_hp}/{mercenary.stats.max_hp}
          </span>
        </div>
        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-red-500 transition-[width] duration-300"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>
      <div className="text-muted-foreground text-[9px] sm:text-[10px]">
        {attacked ? `攻击 -${mercenary.last_attack?.damage ?? 0}` : `Lv.${mercenary.level}`}
      </div>
    </div>
  )
}
