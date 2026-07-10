'use client'

import { type CombatMonster, type SkillUsedEntry } from '../../types'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { MonsterIcon } from './MonsterIcon'
import { MonsterGroup } from './MonsterGroup'
import { SkillEffect, type SkillEffectType } from './effects'
import { soundManager } from '../../utils/soundManager'
import { getSkillSoundDuration } from '../../utils/skillSoundRegistry'
import styles from '../../rpg.module.css'

const CHARACTER_DAMAGE_TEXT_MS = 2200
const CHARACTER_REGEN_STAGGER_MS = 350

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
  combatLogId,
  damageTaken,
  roundRegen,
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
  combatLogId?: number | null
  damageTaken?: number
  roundRegen?: Record<string, { name: string; restored: number }> | null
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
  const lastCharacterEffectsLogIdRef = useRef<number | null>(null)
  const characterTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const [displayCharacterHp, setDisplayCharacterHp] = useState<number | null>(null)
  const [displayCharacterMana, setDisplayCharacterMana] = useState<number | null>(null)
  const [characterDamageText, setCharacterDamageText] = useState<number | null>(null)
  const [characterRegenHpText, setCharacterRegenHpText] = useState<number | null>(null)
  const [characterRegenMpText, setCharacterRegenMpText] = useState<number | null>(null)
  const [characterHit, setCharacterHit] = useState(false)

  const finalCharacterHp = currentHp ?? 0
  const finalCharacterMana = currentMana ?? 0
  const hpRegen = roundRegen?.hp?.restored ?? 0
  const mpRegen = roundRegen?.mp?.restored ?? 0
  const hpAfterMonsterHit = finalCharacterHp - hpRegen
  const hpBeforeMonsterHit = finalCharacterHp + (damageTaken ?? 0) - hpRegen
  const manaBeforeRegen = finalCharacterMana - mpRegen

  const scheduleCharacterTimeout = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      characterTimersRef.current.delete(t)
      fn()
    }, ms)
    characterTimersRef.current.add(t)
    return t
  }, [])

  useEffect(() => {
    const timers = characterTimersRef.current
    return () => {
      timers.forEach(clearTimeout)
      timers.clear()
    }
  }, [])

  const notifyRoundVisualSettled = useCallback(() => {
    if (!onRoundVisualSettled) return
    if (combatLogId != null && combatLogId === lastNotifiedLogIdRef.current) return
    if (combatLogId != null) lastNotifiedLogIdRef.current = combatLogId
    onRoundVisualSettled()
  }, [combatLogId, onRoundVisualSettled])

  // 检测怪物死亡
  const isMonsterDead = finalMonsterHp <= 0

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

  // 用 combatLogId + skill_id + round 识别技能回合，避免新战斗同技能同回合被当成旧回合
  const skillRoundKey = useMemo(() => {
    if (!skillUsed || !computedSkillEffect) return null
    return `${combatLogId ?? 'pending'}:${skillUsed.skill_id}:${skillUsed.round ?? 'na'}:${computedSkillEffect}`
  }, [skillUsed, computedSkillEffect, combatLogId])
  const lastSkillRoundKeyRef = useRef<string | null>(null)
  const [settledSkillRoundKey, setSettledSkillRoundKey] = useState<string | null>(null)
  const [monsterAppearBlocking, setMonsterAppearBlocking] = useState(false)
  const skillRoundPending = Boolean(skillRoundKey && settledSkillRoundKey !== skillRoundKey)
  const deferDamageDisplay = skillRoundPending || monsterAppearBlocking
  const showDamageAndHp = !deferDamageDisplay
  const activeSkillEffect = skillRoundPending && !monsterAppearBlocking ? computedSkillEffect : null

  const effectiveCharacterHp = deferDamageDisplay
    ? hpBeforeMonsterHit
    : (displayCharacterHp ?? finalCharacterHp)
  const effectiveCharacterMana = deferDamageDisplay
    ? manaBeforeRegen
    : (displayCharacterMana ?? finalCharacterMana)
  const hpPercent = combatStats?.max_hp
    ? Math.min(100, Math.max(0, (effectiveCharacterHp / combatStats.max_hp) * 100))
    : 0
  const manaPercent = combatStats?.max_mana
    ? Math.min(100, Math.max(0, (effectiveCharacterMana / combatStats.max_mana) * 100))
    : 0

  const handleAppearActiveChange = useCallback((active: boolean) => {
    setMonsterAppearBlocking(active)
  }, [])

  // 新回合到达时重置角色动画状态
  useEffect(() => {
    if (combatLogId == null) return
    queueMicrotask(() => {
      lastCharacterEffectsLogIdRef.current = null
      setDisplayCharacterHp(null)
      setDisplayCharacterMana(null)
      setCharacterDamageText(null)
      setCharacterRegenHpText(null)
      setCharacterRegenMpText(null)
      setCharacterHit(false)
    })
  }, [combatLogId])

  // 与怪物扣血同步：展示角色受击飘字、恢复飘字与血条变化
  useEffect(() => {
    if (!showDamageAndHp || combatLogId == null) return
    if (combatLogId === lastCharacterEffectsLogIdRef.current) return

    const taken = damageTaken ?? 0
    const regenDelay = taken > 0 ? CHARACTER_REGEN_STAGGER_MS : 0
    const logId = combatLogId

    queueMicrotask(() => {
      lastCharacterEffectsLogIdRef.current = logId

      if (taken > 0) {
        setCharacterDamageText(taken)
        setCharacterHit(true)
        setDisplayCharacterHp(hpAfterMonsterHit)
        scheduleCharacterTimeout(() => setCharacterHit(false), 300)
        scheduleCharacterTimeout(() => setCharacterDamageText(null), CHARACTER_DAMAGE_TEXT_MS)
      } else {
        setDisplayCharacterHp(finalCharacterHp)
      }

      if (hpRegen > 0) {
        scheduleCharacterTimeout(() => {
          setCharacterRegenHpText(hpRegen)
          setDisplayCharacterHp(finalCharacterHp)
          scheduleCharacterTimeout(() => setCharacterRegenHpText(null), CHARACTER_DAMAGE_TEXT_MS)
        }, regenDelay)
      }

      if (mpRegen > 0) {
        scheduleCharacterTimeout(() => {
          setCharacterRegenMpText(mpRegen)
          setDisplayCharacterMana(finalCharacterMana)
          scheduleCharacterTimeout(() => setCharacterRegenMpText(null), CHARACTER_DAMAGE_TEXT_MS)
        }, regenDelay)
      } else {
        setDisplayCharacterMana(finalCharacterMana)
      }
    })
  }, [
    showDamageAndHp,
    combatLogId,
    damageTaken,
    hpRegen,
    mpRegen,
    hpAfterMonsterHit,
    finalCharacterHp,
    finalCharacterMana,
    scheduleCharacterTimeout,
  ])

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
      lastPlayedSkillSoundRef.current = null
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
      <div className={styles['battlefield-vignette']} aria-hidden />
      <div className={styles['battlefield-ground']} aria-hidden />

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
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {activeSkillEffect && skillUsed && (
          <div
            className={`${styles['skill-cast-banner']} pointer-events-none absolute top-[46%] left-1/2 z-30 -translate-x-1/2`}
          >
            <span className="text-[10px] font-semibold tracking-normal text-white/70">
              释放技能
            </span>
            <strong className="block text-sm tracking-normal text-white sm:text-base">
              {skillUsed.name}
            </strong>
          </div>
        )}

        {/* 上侧：怪物区限高最多三排，给下方角色留出空间 */}
        <div className="flex max-h-[min(52%,16rem)] min-h-[42%] flex-none flex-col items-center justify-end gap-1 overflow-hidden px-2 pt-5 sm:px-4 sm:pt-7">
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
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm sm:text-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              正在寻找敌人
            </div>
          ) : (
            <div className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs text-white/75 backdrop-blur-sm sm:text-sm">
              战斗已暂停
            </div>
          )}
          {!isLoading && isFighting && !hasValidMonsters && !monster && !monsterId && (
            <div className="text-muted-foreground flex-1 text-xs">战斗中</div>
          )}
        </div>

        {/* 下侧：角色 */}
        <div className="mt-auto flex shrink-0 items-end justify-center p-3 sm:p-5">
          <div className="border-white/15 bg-black/55 flex w-full max-w-md items-center gap-3 rounded-lg border p-2.5 shadow-lg backdrop-blur-md sm:gap-4 sm:p-3">
            <div
              className={`border-primary/60 bg-primary/25 text-primary relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 text-xl font-bold shadow-[0_0_18px_rgba(59,130,246,0.28)] sm:h-16 sm:w-16 sm:text-2xl ${characterHit ? styles['character-hit'] : isFighting ? styles['character-idle'] : ''}`}
            >
              {(characterDamageText != null ||
                characterRegenHpText != null ||
                characterRegenMpText != null) && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 flex -translate-x-1/2 flex-col items-center gap-0.5 whitespace-nowrap">
                  {characterDamageText != null && (
                    <span className={styles['damage-number']}>-{characterDamageText}</span>
                  )}
                  {(characterRegenHpText != null || characterRegenMpText != null) && (
                    <div className="flex items-center gap-2">
                      {characterRegenHpText != null && (
                        <span className={`${styles['regen-number']} text-emerald-300`}>
                          +{characterRegenHpText}
                        </span>
                      )}
                      {characterRegenMpText != null && (
                        <span className={`${styles['regen-number']} text-sky-300`}>
                          +{characterRegenMpText}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              {character?.name?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-baseline justify-between gap-2 text-white">
                <span className="truncate text-sm font-semibold sm:text-base">
                  {character?.name ?? '冒险者'}
                </span>
                {character && (
                  <span className="shrink-0 text-[10px] text-white/60 sm:text-xs">
                    Lv.{character.level} {character.class}
                  </span>
                )}
              </div>
              {combatStats && (
                <div className="space-y-1.5">
                  <div>
                    <div className="mb-0.5 flex justify-between text-[10px] font-medium text-white/75 sm:text-xs">
                      <span>生命</span>
                      <span className="tabular-nums">
                        {effectiveCharacterHp} / {combatStats.max_hp}
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-sm bg-black/45 ring-1 ring-white/10">
                      <div
                        className={`${styles['health-bar-fill']} h-full bg-gradient-to-r from-red-700 via-red-500 to-rose-400 transition-[width] duration-300`}
                        style={{ width: `${hpPercent}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-0.5 flex justify-between text-[10px] font-medium text-white/75 sm:text-xs">
                      <span>魔法</span>
                      <span className="tabular-nums">
                        {effectiveCharacterMana} / {combatStats.max_mana}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-sm bg-black/45 ring-1 ring-white/10">
                      <div
                        className={`${styles['mana-bar-fill']} h-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-300 transition-[width] duration-300`}
                        style={{ width: `${manaPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
