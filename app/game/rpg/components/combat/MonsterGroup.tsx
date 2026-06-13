'use client'

import { type CombatMonster, type SkillUsedEntry } from '../../types'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MonsterIcon } from './MonsterIcon'
import { MonsterInfoDialog } from './MonsterInfoDialog'
import {
  isRenderableCombatMonster,
  COMBAT_MONSTER_COLS,
  COMBAT_MONSTER_MAX_ROWS,
} from '../../utils/combatUtils'
import styles from '../../rpg.module.css'

type MonsterWithMeta = CombatMonster & { damage_taken?: number; was_attacked?: boolean }

// sessionStorage key，用于持久化已显示过动画的怪物 instance_id
const APPEARED_MONSTERS_KEY = 'rpg_appeared_monsters'

/** 获取已显示过动画的怪物 ID 集合 */
function getAppearedMonsters(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = sessionStorage.getItem(APPEARED_MONSTERS_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

/** 战斗栏 HP 紧凑显示，避免大数值撑宽导致换行 */
function formatMonsterHp(hp: number | undefined, maxHp: number | undefined): string {
  const format = (value: number) => {
    if (value >= 100_000) return `${Math.round(value / 1000)}k`
    if (value >= 10_000) return `${(value / 1000).toFixed(1)}k`
    return String(value)
  }
  return `${format(hp ?? 0)}/${format(maxHp ?? 0)}`
}

/** 保存已显示过动画的怪物 ID */
function saveAppearedMonsters(ids: Set<string>): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(APPEARED_MONSTERS_KEY, JSON.stringify([...ids]))
  } catch {
    // ignore
  }
}

/** 显示多只怪物（固定5个位置，支持 null 占位） */
export function MonsterGroup({
  monsters,
  skillUsed,
  skillTargetPositions,
  showDamageAndHp = true,
}: {
  monsters: (MonsterWithMeta | null)[]
  skillUsed?: SkillUsedEntry | null
  skillTargetPositions?: number[]
  /** 为 false 时表示技能动画中，不显示扣血/伤害/受击，并清空已有状态避免重复播放 */
  showDamageAndHp?: boolean
}) {
  const prevMonstersRef = useRef<MonsterWithMeta[]>([])
  // 存储上一次的 instance_id，用于检测新怪物（持久化，避免切换导航后重新触发动画）
  // 初始化时从 sessionStorage 读取，避免组件重新挂载后丢失状态
  const prevInstanceIdsRef = useRef<Set<string>>(getAppearedMonsters())
  // 存储当前新出现的怪物 instance_id（立即可用，不需要等待状态更新）
  const newAppearingRef = useRef<Set<string>>(new Set())
  const [damageTexts, setDamageTexts] = useState<Record<string, number>>({})
  // 选中的怪物（用于弹窗显示）
  const [selectedMonster, setSelectedMonster] = useState<MonsterWithMeta | null>(null)
  // 记录死亡的怪物，用于触发动画
  const [deadMonsters, setDeadMonsters] = useState<Set<string>>(new Set())
  // 记录需要显示出现动画的怪物 instance_id（仅当前会话使用，不从 sessionStorage 初始化）
  const [appearingMonsters, setAppearingMonsters] = useState<Set<string>>(new Set())
  // 记录需要显示被攻击后退动画的怪物 position
  const [hitMonsters, setHitMonsters] = useState<Set<number>>(new Set())
  // 本组件创建的所有定时器，卸载时统一清理，避免对已卸载组件 setState
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  const scheduleTimeout = (fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timersRef.current.delete(t)
      fn()
    }, ms)
    timersRef.current.add(t)
  }

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(clearTimeout)
      timers.clear()
    }
  }, [])

  const handleMonsterClick = (m: MonsterWithMeta) => {
    setSelectedMonster(m)
  }

  // 过滤出有效的怪物（用于效果和新怪物检测）
  const validMonsters = useMemo(
    () => monsters?.filter((m): m is MonsterWithMeta => isRenderableCombatMonster(m)) ?? [],
    [monsters]
  )

  // 检查是否有有效怪物
  const hasValidMonsters = validMonsters.length > 0

  // 检测怪物掉血并显示伤害数字，以及检测新怪物
  useEffect(() => {
    if (!showDamageAndHp) return

    // 检测新怪物：通过比较 instance_id
    const currentInstanceIds = new Set<string>(
      validMonsters.map(m => m.instance_id).filter((id): id is string => Boolean(id))
    )
    const prevInstanceIds = prevInstanceIdsRef.current

    // 获取已显示过动画的怪物（持久化）
    const appearedMonsters = getAppearedMonsters()

    // 找出新出现的怪物 instance_id（排除已显示过动画的）
    const newAppearing: string[] = []
    currentInstanceIds.forEach(instanceId => {
      if (instanceId && !prevInstanceIds.has(instanceId) && !appearedMonsters.has(instanceId)) {
        newAppearing.push(instanceId)
      }
    })

    if (newAppearing.length > 0) {
      // 立即更新 ref，用于渲染时判断
      newAppearingRef.current = new Set(newAppearing)
      queueMicrotask(() => {
        setAppearingMonsters(prev => {
          const next = new Set(prev)
          newAppearing.forEach(id => next.add(id))
          return next
        })
        // 持久化保存已显示过动画的怪物 ID
        const updatedAppeared = new Set(appearedMonsters)
        newAppearing.forEach(id => updatedAppeared.add(id))
        saveAppearedMonsters(updatedAppeared)
      })
      // 1.2秒后移除动画标记（与 monster-appear 动画时长一致）
      scheduleTimeout(() => {
        setAppearingMonsters(prev => {
          const next = new Set(prev)
          newAppearing.forEach(id => next.delete(id))
          return next
        })
        newAppearing.forEach(id => newAppearingRef.current.delete(id))
      }, 1200)
    }

    // 更新上一次的 instance_id
    prevInstanceIdsRef.current = currentInstanceIds

    if (prevMonstersRef.current.length === 0 || validMonsters.length === 0) {
      prevMonstersRef.current = validMonsters
      return
    }

    const newDamage: Record<string, number> = {}

    validMonsters.forEach(m => {
      // 使用 position 作为 key 来区分同一波中的不同怪物实例
      const key = `pos-${m.position}`
      const d = m.damage_taken
      // damage_taken >= 0 表示本回合被攻击了，-1 表示未受攻击
      if (d != null && d >= 0) {
        newDamage[key] = d
      }
    })

    if (Object.keys(newDamage).length > 0) {
      queueMicrotask(() => {
        setDamageTexts(newDamage)
        scheduleTimeout(() => setDamageTexts({}), 1500)
      })
      // 触发被攻击后退动画（被攻击且伤害大于0时）
      const hitPositions = validMonsters
        .filter(
          m =>
            m.damage_taken != null &&
            m.damage_taken >= 0 &&
            m.damage_taken > 0 &&
            m.position != null
        )
        .map(m => m.position as number)
      if (hitPositions.length > 0) {
        queueMicrotask(() => {
          setHitMonsters(new Set(hitPositions))
          // 300ms后清除动画状态（与 monster-hit 动画时长一致）
          scheduleTimeout(() => setHitMonsters(new Set()), 300)
        })
      }
    }

    // 检测怪物死亡/复位：HP <= 0 时触发死亡动画；该位置出现活怪（新一波）时移除标记
    queueMicrotask(() => {
      setDeadMonsters(prev => {
        let changed = false
        const next = new Set(prev)
        validMonsters.forEach(m => {
          const key = `pos-${m.position}`
          if ((m.hp ?? 0) <= 0) {
            if (!next.has(key)) {
              next.add(key)
              changed = true
            }
          } else if (next.has(key)) {
            next.delete(key)
            changed = true
          }
        })
        return changed ? next : prev
      })
    })

    prevMonstersRef.current = validMonsters
  }, [validMonsters, showDamageAndHp])

  // 检测战斗结束（没有活着的怪物）时清除已显示动画的缓存
  useEffect(() => {
    const hasAliveMonsters = validMonsters.some(m => (m.hp ?? 0) > 0)
    if (!hasAliveMonsters && validMonsters.length > 0) {
      // 战斗结束，清除缓存
      saveAppearedMonsters(new Set())
    }
  }, [validMonsters])

  // 如果没有有效怪物则不渲染
  if (!hasValidMonsters) return null

  const iconSize = validMonsters.length >= 4 ? 'sm' : 'md'
  const slotPositions = Array.from({ length: COMBAT_MONSTER_COLS }, (_, i) => i)

  return (
    <>
      <div
        className="grid w-full max-w-[18rem] grid-cols-5 items-end justify-items-center gap-x-0.5 gap-y-1 overflow-hidden sm:max-w-[20rem]"
        style={{ gridTemplateRows: `repeat(${COMBAT_MONSTER_MAX_ROWS}, minmax(0, auto))` }}
      >
        {slotPositions.map(pos => {
          const m = monsters[pos]
          if (!isRenderableCombatMonster(m)) {
            return <div key={`slot-${pos}`} className="min-h-px w-full" aria-hidden />
          }

          const monsterKey = `pos-${m.position ?? pos}`
          const isDying = (m.hp ?? 0) <= 0 && deadMonsters.has(monsterKey)
          // 死亡动画结束后不再占位，避免堆叠占满屏幕
          if ((m.hp ?? 0) <= 0 && !isDying) {
            return <div key={`slot-${pos}`} className="min-h-px w-full" aria-hidden />
          }

          const isNew = m.instance_id ? appearingMonsters.has(m.instance_id) : false
          const damage = showDamageAndHp ? damageTexts[monsterKey] : undefined
          const isDead = isDying
          const isHit = showDamageAndHp && m.position != null && hitMonsters.has(m.position)

          // 使用 instance_id 作为 key，这样新怪物出现时会重新创建元素触发动画
          return (
            <button
              key={m.instance_id ?? monsterKey}
              type="button"
              onClick={() => handleMonsterClick(m)}
              className={`relative flex w-full min-w-0 cursor-pointer flex-col items-center gap-0.5 transition-opacity hover:opacity-80 ${isNew ? styles['monster-appear'] : ''} ${isDead ? styles['monster-death'] : ''} ${isHit ? styles['monster-hit'] : ''}`}
              title={`点击查看 ${m.name} 详情`}
            >
              {damage !== undefined && (
                <span className="pointer-events-none absolute top-1 left-1/2 z-20 -translate-x-1/2 rounded bg-black/70 px-1 text-xs font-bold text-red-400 drop-shadow sm:text-sm">
                  -{damage}
                </span>
              )}
              <MonsterIcon icon={m.icon} name={m.name} size={iconSize} monsterType={m.type} />
              <div className="w-full min-w-0 px-0.5">
                <div className="text-muted-foreground flex min-w-0 items-center justify-between gap-0.5 text-[7px] leading-none sm:text-[9px]">
                  <span className="shrink-0">HP</span>
                  <span className="truncate tabular-nums" title={`${m.hp ?? 0}/${m.max_hp ?? 0}`}>
                    {formatMonsterHp(m.hp, m.max_hp)}
                  </span>
                </div>
                <div className="bg-muted mt-0.5 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-red-600 transition-all duration-300"
                    style={{
                      width: `${
                        m.max_hp && m.max_hp > 0
                          ? Math.min(100, Math.max(0, ((m.hp ?? 0) / m.max_hp) * 100))
                          : 100
                      }%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-muted-foreground w-full truncate px-0.5 text-center text-[9px] sm:text-[10px]">
                {m.name}
              </p>
            </button>
          )
        })}
      </div>

      {/* 怪物信息弹窗 */}
      <MonsterInfoDialog monster={selectedMonster} onClose={() => setSelectedMonster(null)} />
    </>
  )
}
