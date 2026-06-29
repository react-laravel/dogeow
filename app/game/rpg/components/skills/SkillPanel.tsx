'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../stores/gameStore'
import type { SkillWithLearnedState, SkillStage } from '../../types'
import { SkillIcon } from '../shared/SkillIcon'

const STAGE_TABS: { id: SkillStage; name: string; unlock: number }[] = [
  { id: 'basic', name: '基础', unlock: 1 },
  { id: 'core', name: '核心', unlock: 5 },
  { id: 'defensive', name: '防御', unlock: 15 },
  { id: 'special', name: '特殊', unlock: 25 },
  { id: 'ultimate', name: '终极', unlock: 40 },
  { id: 'key_passive', name: '关键被动', unlock: 50 },
]

/** 第 1/2 层：比专精单列宽，比整行窄 */
const TIER12_CARD_WIDTH = 'w-[calc(60%+1rem)]'

function isD4Skill(skill: SkillWithLearnedState): boolean {
  return Boolean(skill.skill_line)
}

function getNodeTier(skill: SkillWithLearnedState): number {
  return Number(skill.node_tier ?? 0)
}

function getBaseSkillName(lineSkills: SkillWithLearnedState[]): string {
  const base = lineSkills.find(s => getNodeTier(s) === 0)
  return base?.name ?? lineSkills[0]?.name ?? '技能线'
}

/** 竖向连接线 */
function TreeStem({ height = 'h-3' }: { height?: string }) {
  return (
    <div className="flex justify-center" aria-hidden>
      <div className={`bg-border w-px ${height}`} />
    </div>
  )
}

/** 分叉到 A/B 专精（与下方 grid-cols-2 同宽，竖线对齐列中心） */
function SpecBranchFork() {
  return (
    <div className="col-span-2 grid grid-cols-2 gap-2" aria-hidden>
      <div className="col-span-2 flex justify-center">
        <div className="bg-border h-3 w-px" />
      </div>
      <div className="relative h-4">
        <div className="bg-border absolute top-0 right-[-0.25rem] left-1/2 h-px" />
        <div className="bg-border absolute top-0 left-1/2 h-full w-px -translate-x-1/2" />
      </div>
      <div className="relative h-4">
        <div className="bg-border absolute top-0 right-1/2 left-[-0.25rem] h-px" />
        <div className="bg-border absolute top-0 left-1/2 h-full w-px -translate-x-1/2" />
      </div>
    </div>
  )
}

function SkillNodeCard({
  skill,
  learnedSkillIds,
  canLearnSkill,
  lockReason,
  onLearn,
  compact,
}: {
  skill: SkillWithLearnedState
  learnedSkillIds: Set<number>
  canLearnSkill: (skill: SkillWithLearnedState) => boolean
  lockReason: (skill: SkillWithLearnedState) => string | null
  onLearn: (skill: SkillWithLearnedState) => void
  compact?: boolean
}) {
  const isLearned = learnedSkillIds.has(skill.id)
  const canLearn = canLearnSkill(skill)
  const reason = lockReason(skill)
  const isLocked = !isLearned && reason !== null
  const nodeTier = getNodeTier(skill)

  const tierLabel =
    nodeTier === 0
      ? '本体'
      : nodeTier === 1
        ? '强化'
        : `专精 ${(skill.spec_branch ?? '').toUpperCase()}`

  const level = skill.level ?? 1
  const manaCost = skill.mana_cost + (level - 1) * (skill.mana_cost_per_level ?? 0)
  const hasManaCost = manaCost > 0

  let cardClass = 'flex items-start gap-1.5 rounded-lg border p-1.5 transition-all min-w-0 '
  if (isLearned) {
    cardClass += 'border-green-600 bg-green-900/30 shadow-[inset_0_0_0_1px_rgba(22,163,74,0.25)]'
  } else if (isLocked) {
    cardClass += 'border-dashed border-muted-foreground/40 bg-muted/15 opacity-70'
  } else if (canLearn) {
    cardClass += 'border-primary/50 bg-muted/50 hover:border-primary cursor-pointer'
  } else {
    cardClass += 'border-border/50 bg-muted/25 opacity-55'
  }

  if (nodeTier === 2 && isLearned) {
    cardClass += ' ring-1 ring-amber-500/40'
  }

  return (
    <div
      className={cardClass + (compact ? ' flex-1 flex-col items-stretch' : '')}
      onClick={() => !isLearned && !isLocked && canLearn && onLearn(skill)}
      role={!isLearned && canLearn && !isLocked ? 'button' : undefined}
    >
      <span
        className={`flex shrink-0 items-center justify-center ${compact ? 'h-8 w-8' : 'h-9 w-9 sm:h-10 sm:w-10'}`}
      >
        <SkillIcon icon={skill.icon} effectKey={skill.effect_key} name={skill.name || ''} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1">
          <span
            className={`text-foreground font-medium ${compact ? 'text-[11px] leading-tight' : 'text-xs sm:text-sm'}`}
          >
            {skill.name}
          </span>
          <span
            className={`rounded px-1 py-0.5 text-[10px] ${
              nodeTier === 2
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : nodeTier === 1
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {tierLabel}
          </span>
          {isLearned && (
            <span className="rounded bg-green-600/20 px-1 py-0.5 text-[10px] text-green-600">
              已学
            </span>
          )}
        </div>
        {!compact && (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[11px]">
            {skill.description}
          </p>
        )}
        {compact && (
          <p className="text-muted-foreground mt-0.5 line-clamp-3 text-[10px]">
            {skill.description}
          </p>
        )}
        {isLocked && reason && <p className="mt-1 text-[10px] text-yellow-600">{reason}</p>}
        {!isLearned && !isLocked && (
          <span className="mt-1 inline-block text-[10px] text-yellow-600">
            {skill.skill_points_cost ?? 1} 点
          </span>
        )}
        {hasManaCost && (
          <span className="ml-1.5 mt-1 inline-block text-[10px] text-blue-600 dark:text-blue-400">
            {manaCost} MP
          </span>
        )}
      </div>
    </div>
  )
}

function SkillLineTree({
  lineSkills,
  learnedSkillIds,
  canLearnSkill,
  lockReason,
  onLearn,
}: {
  lineSkills: SkillWithLearnedState[]
  learnedSkillIds: Set<number>
  canLearnSkill: (skill: SkillWithLearnedState) => boolean
  lockReason: (skill: SkillWithLearnedState) => string | null
  onLearn: (skill: SkillWithLearnedState) => void
}) {
  const base = lineSkills.find(s => getNodeTier(s) === 0)
  const enhanced = lineSkills.find(s => getNodeTier(s) === 1)
  const specA = lineSkills.find(s => getNodeTier(s) === 2 && s.spec_branch === 'a')
  const specB = lineSkills.find(s => getNodeTier(s) === 2 && s.spec_branch === 'b')
  const isKeyPassive = base?.skill_stage === 'key_passive'

  if (!base) return null

  const learnedInLine = lineSkills.filter(s => learnedSkillIds.has(s.id)).length

  return (
    <div className="border-border bg-card rounded-xl border p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-foreground text-sm font-bold">{getBaseSkillName(lineSkills)}</h4>
        <span className="text-muted-foreground shrink-0 text-[10px]">
          {learnedInLine}/{lineSkills.length} 节点
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <p className="text-muted-foreground col-span-2 mb-0.5 text-center text-[10px] font-medium tracking-wide uppercase">
          第 1 层 · 本体
        </p>
        <div className="col-span-2 flex justify-center">
          <div className={`min-w-0 ${TIER12_CARD_WIDTH}`}>
            <SkillNodeCard
              skill={base}
              learnedSkillIds={learnedSkillIds}
              canLearnSkill={canLearnSkill}
              lockReason={lockReason}
              onLearn={onLearn}
            />
          </div>
        </div>

        {!isKeyPassive && enhanced && (
          <>
            <div className="col-span-2">
              <TreeStem />
            </div>
            <p className="text-muted-foreground col-span-2 mb-0.5 text-center text-[10px] font-medium tracking-wide uppercase">
              第 2 层 · 强化
            </p>
            <div className="col-span-2 flex justify-center">
              <div className={`min-w-0 ${TIER12_CARD_WIDTH}`}>
                <SkillNodeCard
                  skill={enhanced}
                  learnedSkillIds={learnedSkillIds}
                  canLearnSkill={canLearnSkill}
                  lockReason={lockReason}
                  onLearn={onLearn}
                />
              </div>
            </div>
          </>
        )}

        {!isKeyPassive && specA && specB && (
          <>
            <SpecBranchFork />
            <p className="text-muted-foreground col-span-2 mb-0.5 text-center text-[10px] font-medium">
              第 3 层 · 专精（二选一）
            </p>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-center text-[10px] text-amber-600/80">分支 A</span>
              <SkillNodeCard
                skill={specA}
                learnedSkillIds={learnedSkillIds}
                canLearnSkill={canLearnSkill}
                lockReason={lockReason}
                onLearn={onLearn}
                compact
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-center text-[10px] text-amber-600/80">分支 B</span>
              <SkillNodeCard
                skill={specB}
                learnedSkillIds={learnedSkillIds}
                canLearnSkill={canLearnSkill}
                lockReason={lockReason}
                onLearn={onLearn}
                compact
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

type StageSection = {
  id: SkillStage
  name: string
  unlock: number
  lines: SkillWithLearnedState[][]
  learnedLineCount: number
}

function groupSkillsByLines(skillsInStage: SkillWithLearnedState[]): SkillWithLearnedState[][] {
  const lineMap = new Map<string, SkillWithLearnedState[]>()
  for (const skill of skillsInStage) {
    const line = skill.skill_line as string
    const list = lineMap.get(line) ?? []
    list.push(skill)
    lineMap.set(line, list)
  }
  return Array.from(lineMap.values()).map(list =>
    [...list].sort((a, b) => getNodeTier(a) - getNodeTier(b))
  )
}

export function SkillPanel() {
  const { character, skills, learnSkill, isLoading, fetchSkills } = useGameStore(
    useShallow(s => ({
      character: s.character,
      skills: s.skills,
      learnSkill: s.learnSkill,
      isLoading: s.isLoading,
      fetchSkills: s.fetchSkills,
    }))
  )
  const [learningSkill, setLearningSkill] = useState<SkillWithLearnedState | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void fetchSkills()
  }, [fetchSkills])

  const treeSkills = useMemo(() => skills.filter(isD4Skill), [skills])

  const learnedSkillIds = useMemo(
    () => new Set(treeSkills.filter(s => s.is_learned).map(s => s.id)),
    [treeSkills]
  )

  const stageSections = useMemo((): StageSection[] => {
    return STAGE_TABS.map(tab => {
      const stageSkills = treeSkills.filter(s => s.skill_stage === tab.id)
      const lines = groupSkillsByLines(stageSkills)
      const learnedLineCount = lines.filter(line =>
        line.some(s => learnedSkillIds.has(s.id))
      ).length
      return { ...tab, lines, learnedLineCount }
    }).filter(section => section.lines.length > 0)
  }, [treeSkills, learnedSkillIds])

  const getSiblingSpecLearned = useCallback(
    (skill: SkillWithLearnedState): SkillWithLearnedState | null => {
      if (getNodeTier(skill) !== 2 || !skill.skill_line || !skill.spec_branch) return null
      return (
        treeSkills.find(
          s =>
            s.skill_line === skill.skill_line &&
            getNodeTier(s) === 2 &&
            s.spec_branch !== skill.spec_branch &&
            learnedSkillIds.has(s.id)
        ) ?? null
      )
    },
    [learnedSkillIds, treeSkills]
  )

  const lockReason = useCallback(
    (skill: SkillWithLearnedState): string | null => {
      if (skill.is_learned) return null
      if (!character) return '无角色'
      if (character.level < (skill.unlock_level ?? 1)) {
        return `${skill.unlock_level ?? 1} 级解锁`
      }
      if (skill.prerequisite_skill_id && !learnedSkillIds.has(skill.prerequisite_skill_id)) {
        const prereq = treeSkills.find(s => s.id === skill.prerequisite_skill_id)
        return prereq ? `需先学「${prereq.name}」` : '需先学前置节点'
      }
      return null
    },
    [character, learnedSkillIds, treeSkills]
  )

  const canLearnSkill = useCallback(
    (skill: SkillWithLearnedState): boolean => {
      if (skill.is_learned) return false
      if (lockReason(skill)) return false
      if (!character) return false
      const isRespec = getSiblingSpecLearned(skill) !== null
      const cost = isRespec ? 0 : (skill.skill_points_cost ?? 1)
      return character.skill_points >= cost
    },
    [character, getSiblingSpecLearned, lockReason]
  )

  const handleLearnClick = useCallback(
    (skill: SkillWithLearnedState) => {
      if (!skill.is_learned && canLearnSkill(skill)) setLearningSkill(skill)
    },
    [canLearnSkill]
  )

  const handleConfirmLearn = useCallback(async () => {
    if (!learningSkill) return
    await learnSkill(learningSkill.id)
    setLearningSkill(null)
  }, [learningSkill, learnSkill])

  const siblingForConfirm = learningSkill ? getSiblingSpecLearned(learningSkill) : null
  const confirmCost = siblingForConfirm ? 0 : (learningSkill?.skill_points_cost ?? 1)
  const needsReseed = skills.length > 0 && treeSkills.length === 0

  const scrollToStage = useCallback((stageId: SkillStage) => {
    const container = scrollContainerRef.current
    const target = document.getElementById(`skill-stage-${stageId}`)
    if (!target) return

    if (!container || container.scrollHeight <= container.clientHeight + 1) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    const containerRect = container.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const top = container.scrollTop + (targetRect.top - containerRect.top)
    container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden overscroll-none">
      {needsReseed && (
        <div className="mb-2 shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          技能数据尚未更新，请在后端执行{' '}
          <code className="text-xs">
            php artisan db:seed --class=Database\Seeders\Game\GameSeeder
          </code>
          ，然后
          <button
            type="button"
            className="text-primary mx-1 underline"
            onClick={() => void fetchSkills()}
          >
            点击刷新
          </button>
        </div>
      )}

      {character != null && (
        <div className="border-border bg-background shrink-0 space-y-2 border-b pb-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-sm">技能树</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">技能点</span>
              <span className="text-primary text-lg font-bold">{character.skill_points}</span>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {stageSections.map(section => {
              const locked = character.level < section.unlock
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToStage(section.id)}
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    locked
                      ? 'border-border/60 bg-muted/30 text-muted-foreground'
                      : 'border-border bg-muted/50 text-foreground hover:bg-muted'
                  }`}
                >
                  {section.name}
                  <span className="ml-1 opacity-60">
                    {section.learnedLineCount}/{section.lines.length}
                  </span>
                  {locked && (
                    <span className="ml-1 text-[10px] opacity-70">Lv{section.unlock}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-2 touch-pan-y"
      >
        <div className="space-y-5">
          {stageSections.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">暂无技能线</p>
          ) : (
            stageSections.map(section => {
              const locked = character != null && character.level < section.unlock
              return (
                <section key={section.id} id={`skill-stage-${section.id}`} className="space-y-3">
                  <div className="border-border flex items-center gap-2 border-b pb-2">
                    <h3 className="text-foreground text-sm font-bold">{section.name}</h3>
                    <span className="text-muted-foreground text-xs">
                      {section.learnedLineCount}/{section.lines.length} 线
                    </span>
                    {locked ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-yellow-600">
                        {section.unlock} 级解锁
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[10px]">Lv{section.unlock}+</span>
                    )}
                  </div>
                  <div
                    className={`grid grid-cols-1 gap-3 xl:grid-cols-2 ${locked ? 'opacity-80' : ''}`}
                  >
                    {section.lines.map(lineSkills => (
                      <SkillLineTree
                        key={lineSkills[0]?.skill_line ?? lineSkills[0]?.id}
                        lineSkills={lineSkills}
                        learnedSkillIds={learnedSkillIds}
                        canLearnSkill={canLearnSkill}
                        lockReason={lockReason}
                        onLearn={handleLearnClick}
                      />
                    ))}
                  </div>
                </section>
              )
            })
          )}
        </div>
      </div>

      {learningSkill && !learningSkill.is_learned && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border-border w-full max-w-sm rounded-lg border p-4 sm:p-6">
            <h4 className="text-foreground mb-3 text-base font-bold sm:text-lg">
              {siblingForConfirm ? '切换专精分支' : '学习技能'}
            </h4>
            <p className="text-muted-foreground mb-2 text-sm">
              {siblingForConfirm ? (
                <>
                  将专精从 <span className="text-primary">{siblingForConfirm.name}</span> 切换为{' '}
                  <span className="text-primary">{learningSkill.name}</span>？
                </>
              ) : (
                <>
                  确定要学习 <span className="text-primary">{learningSkill.name}</span> 吗？
                </>
              )}
            </p>
            <p className="text-muted-foreground mb-4 text-xs sm:text-sm">
              {confirmCost === 0 ? '专精切换免费，不消耗技能点' : `将消耗 ${confirmCost} 技能点`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLearningSkill(null)}
                className="bg-muted text-foreground hover:bg-secondary rounded px-3 py-2 text-sm"
                disabled={isLoading}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmLearn}
                className="bg-primary hover:bg-primary/90 rounded px-3 py-2 text-sm text-white"
                disabled={isLoading}
              >
                {isLoading ? '处理中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
