'use client'

import { useGameStore } from '../../stores/gameStore'
import {
  type CombatLog as CombatLogType,
  type CombatMonster,
  type CombatResult,
  type SkillUsedEntry,
} from '../../types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CharacterSkill, SkillWithLearnedState } from '../../types'
import type { MapDefinition } from '../../types'
import { getMapBackgroundStyle } from '../../utils/mapBackground'
import { BattleArena } from './BattleArena'
import { BattleSkillBar, type SkillBarLayout } from './BattleSkillBar'
import { CombatLogList } from './CombatLogList'
import { VSSwords } from './VSSwords'
import { getActName } from '../../utils/combat'
import {
  getPrimaryCombatMonster,
  getPrimaryCombatMonsterId,
  normalizeCombatMonsterSlots,
} from '../../utils/combatUtils'
import { extractCombatLogId } from '../../stores/combatHelpers'
import { MapCardMonsterAvatar } from './MapCardMonsterAvatar'
import {
  ChevronDown,
  GalleryHorizontal,
  History,
  LayoutGrid,
  RotateCcw,
  Skull,
  Sparkles,
  X,
} from 'lucide-react'
import { DIFFICULTY_OPTIONS, DIFFICULTY_COLORS } from '../character/CharacterSelect'
const SKILL_BAR_LAYOUT_KEY = 'rpg-skill-bar-layout'

function readSkillBarLayout(): SkillBarLayout {
  if (typeof window === 'undefined') return 'row'
  return localStorage.getItem(SKILL_BAR_LAYOUT_KEY) === 'wrap' ? 'wrap' : 'row'
}

export function CombatPanel() {
  const currentMap = useGameStore(state => state.currentMap)
  const maps = useGameStore(state => state.maps)
  const enterMap = useGameStore(state => state.enterMap)
  const fetchMaps = useGameStore(state => state.fetchMaps)
  const revive = useGameStore(state => state.revive)
  const isFighting = useGameStore(state => state.isFighting)
  const setShouldAutoCombat = useGameStore(state => state.setShouldAutoCombat)
  const stopCombat = useGameStore(state => state.stopCombat)
  const isLoading = useGameStore(state => state.isLoading)
  const combatLogs = useGameStore(state => state.combatLogs)
  const combatResult = useGameStore(state => state.combatResult)
  const flushPendingCombatLog = useGameStore(state => state.flushPendingCombatLog)
  const statusCombatMonsters = useGameStore(state => state.statusCombatMonsters)
  const skills = useGameStore(state => state.skills)
  const character = useGameStore(state => state.character)
  const combatStats = useGameStore(state => state.combatStats)
  const currentHp = useGameStore(state => state.currentHp)
  const currentMana = useGameStore(state => state.currentMana)
  const enabledSkillIds = useGameStore(state => state.enabledSkillIds)
  const toggleEnabledSkill = useGameStore(state => state.toggleEnabledSkill)

  const [mapDropdownOpen, setMapDropdownOpen] = useState(false)
  const [dropdownAct, setDropdownAct] = useState(() => currentMap?.act ?? 1)
  const mapDropdownRef = useRef<HTMLDivElement>(null)
  const [showDeathDialog, setShowDeathDialog] = useState(false)
  const [skillBarLayout, setSkillBarLayout] = useState<SkillBarLayout>(() => readSkillBarLayout())
  const lastAutoStoppedRef = useRef<boolean | undefined>(undefined)
  const handleRoundVisualSettled = useCallback(() => {
    flushPendingCombatLog()
  }, [flushPendingCombatLog])

  // 战斗场景动画异常未回调时，兜底写入战斗日志，避免一直卡在 pending
  useEffect(() => {
    const logId = combatResult?.combat_log_id
    if (!logId || !isFighting) return

    const watchdog = setTimeout(() => {
      const state = useGameStore.getState()
      if (state.pendingCombatLog && extractCombatLogId(state.pendingCombatLog) === logId) {
        state.flushPendingCombatLog()
      }
    }, 3200)

    return () => clearTimeout(watchdog)
  }, [combatResult?.combat_log_id, isFighting])

  // 监听战斗结果，检测角色死亡
  useEffect(() => {
    if (combatResult?.auto_stopped && lastAutoStoppedRef.current !== combatResult.auto_stopped) {
      lastAutoStoppedRef.current = combatResult.auto_stopped
      // 使用 queueMicrotask 延迟 setState，避免 effect 中同步调用
      queueMicrotask(() => {
        setShowDeathDialog(true)
      })
    }
  }, [combatResult?.auto_stopped])

  const mapsByAct = useMemo(() => {
    const actMaps: Record<number, MapDefinition[]> = {}
    for (const map of maps) {
      if (!actMaps[map.act]) actMaps[map.act] = []
      actMaps[map.act].push(map)
    }
    return actMaps
  }, [maps])
  const actOrder = useMemo(
    () =>
      Object.keys(mapsByAct)
        .map(Number)
        .sort((a, b) => a - b),
    [mapsByAct]
  )
  const effectiveAct = actOrder.includes(dropdownAct) ? dropdownAct : (actOrder[0] ?? 1)
  const displayActMaps = mapsByAct[effectiveAct] ?? []

  // 刚注册角色进入战斗界面时，若无当前地图则默认进入第一张地图（按幕数、等级、id 排序）
  useEffect(() => {
    if (!character || currentMap) return
    let cancelled = false
    const ensureFirstMap = async () => {
      if (maps.length === 0) await fetchMaps()
      if (cancelled) return
      const state = useGameStore.getState()
      if (state.currentMap || state.maps.length === 0) return
      const sorted = [...state.maps].sort(
        (a, b) => (a.act !== b.act ? a.act - b.act : 0) || a.id - b.id
      )
      const first = sorted[0]
      if (first) await enterMap(first.id)
    }
    ensureFirstMap()
    return () => {
      cancelled = true
    }
  }, [character, currentMap, maps.length, fetchMaps, enterMap])

  useEffect(() => {
    if (mapDropdownOpen && maps.length === 0) fetchMaps()
  }, [mapDropdownOpen, maps.length, fetchMaps])

  useEffect(() => {
    if (!mapDropdownOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (mapDropdownRef.current && !mapDropdownRef.current.contains(e.target as Node)) {
        setMapDropdownOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [mapDropdownOpen])

  const handleSelectMap = useCallback(
    async (mapId: number) => {
      await enterMap(mapId)
      setMapDropdownOpen(false)
    },
    [enterMap]
  )

  const learnedSkills = useMemo((): CharacterSkill[] => {
    const c = character
    if (!c) return []
    return skills
      .filter(
        (s): s is SkillWithLearnedState & { character_skill_id: number } =>
          s.is_learned && s.character_skill_id != null
      )
      .map(s => ({
        id: s.character_skill_id!,
        character_id: c.id,
        skill_id: s.id,
        skill: s,
        level: s.level ?? 1,
        slot_index: s.slot_index ?? null,
      }))
  }, [skills, character])

  const activeSkills = useMemo(
    () =>
      learnedSkills.filter(
        s =>
          s.skill?.type === 'active' &&
          (s.skill?.node_tier === 0 ||
            s.skill?.node_tier === undefined ||
            s.skill?.node_tier === null)
      ),
    [learnedSkills]
  )
  // skill_cooldowns 是技能冷却到期的回合号，需要减去当前回合数得到剩余冷却
  const currentRound = combatResult?.rounds ?? 0
  const skillCooldowns = useMemo(() => {
    const cooldowns = combatResult?.skill_cooldowns ?? {}
    const result: Record<number, number> = {}
    for (const [skillId, endRound] of Object.entries(cooldowns)) {
      const remaining = (endRound as number) - currentRound
      result[Number(skillId)] = remaining > 0 ? remaining : 0
    }
    return result
  }, [combatResult?.skill_cooldowns, currentRound])

  const handleStartCombat = async () => {
    setShouldAutoCombat(true)
  }

  // 角色死亡时，点击只是复活，不自动开始战斗
  const handleRevive = async () => {
    await revive()
    setShowDeathDialog(false)
  }

  const handleStopCombat = async () => {
    await stopCombat()
  }

  const isCharacterDead = (currentHp ?? 0) <= 0 && (combatStats?.max_hp ?? 0) > 0
  const handleCombatToggle =
    (currentHp ?? 0) <= 0 ? handleRevive : isFighting ? handleStopCombat : handleStartCombat

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(19rem,0.8fr)] xl:gap-4">
        {/* 战场 */}
        <section
          className={`border-border bg-card relative rounded-lg border shadow-sm ${mapDropdownOpen ? 'overflow-visible' : 'overflow-hidden'}`}
        >
          {currentMap && (
            <div
              className="border-border/70 relative z-30 flex min-h-14 items-center justify-between gap-2 border-b bg-black/5 px-3 py-2 backdrop-blur-sm dark:bg-white/5 sm:px-4"
              ref={mapDropdownRef}
            >
              <button
                type="button"
                onClick={() => {
                  if (!mapDropdownOpen && currentMap?.act) setDropdownAct(currentMap.act)
                  setMapDropdownOpen(prev => !prev)
                }}
                className="text-foreground hover:bg-muted/60 focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left transition-colors focus:outline-none focus-visible:ring-2"
                aria-expanded={mapDropdownOpen}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold sm:text-base">
                    {currentMap.name}
                  </span>
                  <span className="text-muted-foreground block text-[10px] leading-tight sm:text-xs">
                    {getActName(currentMap.act)} · 点击切换地图
                  </span>
                </span>
                {character &&
                  character.difficulty_tier != null &&
                  character.difficulty_tier >= 0 && (
                    <span
                      className={`hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white sm:inline ${DIFFICULTY_COLORS[character.difficulty_tier] || 'bg-green-600'}`}
                    >
                      {DIFFICULTY_OPTIONS.find(o => o.tier === character.difficulty_tier)?.label ??
                        '普通'}
                    </span>
                  )}
                <ChevronDown
                  className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform ${mapDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <div className="flex shrink-0 items-center gap-2">
                {isFighting && currentRound > 0 && (
                  <span className="border-border bg-background/70 hidden rounded border px-2 py-1 text-xs tabular-nums sm:inline">
                    第 {currentRound} 回合
                  </span>
                )}
                <VSSwords
                  isFighting={isFighting}
                  isLoading={isLoading}
                  isDead={isCharacterDead}
                  onToggle={handleCombatToggle}
                  variant="inline"
                />
              </div>

              {mapDropdownOpen && (
                <div className="absolute top-full right-0 left-0 z-40 mt-1 flex h-[min(76vh,32rem)] w-full overflow-hidden rounded-lg border border-white/10 bg-neutral-950/95 shadow-2xl backdrop-blur-md">
                  {/* 左侧：幕数列表 */}
                  <div className="flex min-h-0 w-16 shrink-0 flex-col overflow-y-auto overscroll-contain border-r border-white/10">
                    {actOrder.map(actNum => (
                      <button
                        key={actNum}
                        type="button"
                        onClick={() => setDropdownAct(actNum)}
                        className={`flex h-12 shrink-0 items-center justify-center border-b border-white/10 text-xs ${
                          effectiveAct === actNum
                            ? 'bg-primary text-white'
                            : 'text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {getActName(actNum)}
                      </button>
                    ))}
                  </div>
                  {/* 右侧：地图列表 */}
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
                    {displayActMaps.map(map => {
                      const isCurrentMap = currentMap?.id === map.id

                      // 计算怪物等级范围（仅从怪物定义取，无等级限制）
                      const monsterLevels = map.monsters?.map(m => m.level) ?? []
                      const minMonsterLevel =
                        monsterLevels.length > 0 ? Math.min(...monsterLevels) : null
                      const maxMonsterLevel =
                        monsterLevels.length > 0 ? Math.max(...monsterLevels) : null
                      const levelText =
                        minMonsterLevel != null && maxMonsterLevel != null
                          ? `Lv.${minMonsterLevel}-${maxMonsterLevel}`
                          : '—'

                      return (
                        <button
                          key={map.id}
                          type="button"
                          aria-current={isCurrentMap ? 'true' : undefined}
                          onClick={() => {
                            if (!isCurrentMap) {
                              handleSelectMap(map.id)
                              setMapDropdownOpen(false)
                            }
                          }}
                          className={`mb-3 flex min-h-24 w-full items-center justify-between gap-4 rounded-lg p-3 text-left transition-all enabled:cursor-pointer sm:min-h-28 sm:p-4 ${
                            isCurrentMap ? 'ring-primary ring-2' : 'hover:bg-white/10'
                          }`}
                          style={getMapBackgroundStyle(map, { fill: true })}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-base font-medium text-white sm:text-lg">
                              {map.name}
                            </div>
                            <div className="mt-1 text-sm text-gray-300">怪物 {levelText}</div>
                          </div>
                          {map.monsters?.length ? (
                            <div className="flex shrink-0 items-center gap-1.5">
                              {map.monsters.slice(0, 4).map(m => (
                                <MapCardMonsterAvatar
                                  key={m.id}
                                  icon={m.icon}
                                  name={m.name}
                                  large
                                />
                              ))}
                            </div>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentMap ? (
            <div
              className="relative mx-auto aspect-[4/5] w-full overflow-hidden sm:aspect-[4/3] lg:aspect-[16/10]"
              style={getMapBackgroundStyle(currentMap, { useOrigin: true, fill: true })}
            >
              <BattleArena
                character={
                  character
                    ? { name: character.name, class: character.class, level: character.level }
                    : null
                }
                combatStats={combatStats}
                currentHp={currentHp}
                currentMana={currentMana}
                monster={
                  combatResult?.monster ?? getPrimaryCombatMonster(statusCombatMonsters) ?? null
                }
                monsterId={
                  combatResult?.monster_id ??
                  getPrimaryCombatMonsterId(statusCombatMonsters) ??
                  undefined
                }
                monsterHpBeforeRound={combatResult?.monster_hp_before_round}
                monsters={normalizeCombatMonsterSlots(
                  combatResult?.monsters ?? statusCombatMonsters
                )}
                isFighting={isFighting}
                isLoading={isLoading}
                skillUsed={combatResult?.skills_used?.[0]}
                skillTargetPositions={combatResult?.skill_target_positions}
                combatLogId={combatResult?.combat_log_id ?? null}
                damageTaken={combatResult?.damage_taken}
                roundRegen={combatResult?.round_regen}
                onRoundVisualSettled={handleRoundVisualSettled}
              />
            </div>
          ) : (
            <div className="text-muted-foreground flex min-h-72 items-center justify-center text-sm">
              正在准备战场...
            </div>
          )}
        </section>

        {/* 作战侧栏 */}
        <aside className="flex min-w-0 flex-col gap-3 xl:sticky xl:top-[calc(var(--app-header-height,50px)+4.5rem)] xl:max-h-[calc(100dvh-var(--app-header-height,50px)-5.5rem)]">
          {currentMap && activeSkills.length > 0 && (
            <section className="border-border bg-card rounded-lg border p-3 shadow-sm sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary h-4 w-4" />
                  <h3 className="text-sm font-semibold sm:text-base">自动技能</h3>
                  <span className="text-muted-foreground text-xs">
                    {enabledSkillIds.length}/{activeSkills.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSkillBarLayout(prev => {
                      const next: SkillBarLayout = prev === 'row' ? 'wrap' : 'row'
                      localStorage.setItem(SKILL_BAR_LAYOUT_KEY, next)
                      return next
                    })
                  }}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:ring-ring flex h-8 w-8 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2"
                  title={skillBarLayout === 'row' ? '切换为多行显示' : '切换为单行滚动'}
                  aria-label={skillBarLayout === 'row' ? '切换为多行显示' : '切换为单行滚动'}
                >
                  {skillBarLayout === 'row' ? (
                    <LayoutGrid className="h-4 w-4" />
                  ) : (
                    <GalleryHorizontal className="h-4 w-4" />
                  )}
                </button>
              </div>
              <BattleSkillBar
                activeSkills={activeSkills}
                skillsUsed={combatResult?.skills_used}
                skillCooldowns={skillCooldowns}
                enabledSkillIds={enabledSkillIds}
                onSkillToggle={toggleEnabledSkill}
                disabled={showDeathDialog}
                layout={skillBarLayout}
              />
            </section>
          )}

          <section className="border-border bg-card flex min-h-0 flex-col rounded-lg border p-3 shadow-sm sm:p-4 xl:flex-1">
            <div className="mb-2 flex items-center gap-2">
              <History className="text-primary h-4 w-4" />
              <h3 className="text-sm font-semibold sm:text-base">战斗记录</h3>
              {combatLogs.length > 0 && (
                <span className="text-muted-foreground ml-auto text-xs">
                  最近 {Math.min(50, combatLogs.length)} 条
                </span>
              )}
            </div>
            <div className="min-h-0 max-h-72 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1 xl:max-h-none">
              <CombatLogList logs={combatLogs} />
            </div>
          </section>
        </aside>
      </div>

      {/* 死亡弹窗 */}
      {showDeathDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="border-border bg-card w-full max-w-sm rounded-lg border p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-500">
              <Skull className="h-7 w-7" />
            </div>
            <h3 className="text-foreground mb-2 text-xl font-bold">角色已死亡</h3>
            <p className="text-muted-foreground mb-6">你的角色在战斗中不幸阵亡，战斗已自动停止。</p>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  await revive()
                  setShowDeathDialog(false)
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring flex w-full items-center justify-center gap-2 rounded-md py-2.5 font-medium focus:outline-none focus-visible:ring-2"
              >
                <RotateCcw className="h-4 w-4" />
                复活
              </button>
              <button
                onClick={() => setShowDeathDialog(false)}
                className="border-border text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex w-full items-center justify-center gap-2 rounded-md border py-2.5 font-medium focus:outline-none focus-visible:ring-2"
              >
                <X className="h-4 w-4" />
                暂时关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
