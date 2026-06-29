import type { CombatLog, CombatLogDetail, CombatResult, GameCombatUpdateEvent } from '../types'

export type CombatLogEntry = CombatResult | CombatLog

type PersistedCombatLogFields = {
  map_id?: number
  monster_id?: number
  character_level?: number
  character_class?: string
  character_attack?: number
  character_defense?: number
  character_crit_rate?: number
  character_crit_damage?: number
  monster_level?: number
  monster_hp?: number
  monster_max_hp?: number
  monster_attack?: number
  monster_defense?: number
  monster_experience?: number
  monster_copper?: number
  base_attack_damage?: number
  skill_damage?: number
  crit_damage?: number
  aoe_damage?: number
  total_damage_to_monsters?: number
  monster_defense_reduction?: number
  monster_defense_reduction_percent?: number
  monster_counter_damage?: number
  round_number?: number
  monsters_alive_count?: number
  monsters_killed_count?: number
  difficulty_tier?: number
  difficulty_multiplier?: number
  loot_dropped?: Record<string, unknown> | null
  duration_seconds?: number
}

const COMBAT_DEBUG_ENDPOINT = process.env.NEXT_PUBLIC_COMBAT_DEBUG_ENDPOINT
const COMBAT_DEBUG_HEADERS = {
  'Content-Type': 'application/json',
  'X-Debug-Session-Id': process.env.NEXT_PUBLIC_COMBAT_DEBUG_SESSION_ID || '',
}
const COMBAT_DEBUG_BASE = {
  sessionId: process.env.NEXT_PUBLIC_COMBAT_DEBUG_SESSION_ID || '',
  hypothesisId: 'H1',
}

export const reportCombatDebug = (
  location: string,
  message: string,
  data: Record<string, unknown>
) => {
  if (!COMBAT_DEBUG_ENDPOINT) return
  fetch(COMBAT_DEBUG_ENDPOINT, {
    method: 'POST',
    headers: COMBAT_DEBUG_HEADERS,
    body: JSON.stringify({
      ...COMBAT_DEBUG_BASE,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {})
}

/** 从战斗日志条目或推送事件中解析数据库日志 ID */
export const extractCombatLogId = (log: CombatLogEntry | GameCombatUpdateEvent): number | null => {
  if ('combat_log_id' in log && typeof log.combat_log_id === 'number' && log.combat_log_id > 0) {
    return log.combat_log_id
  }

  if ('id' in log && typeof log.id === 'number' && log.id > 0) {
    return log.id
  }

  return null
}

export const mergeCombatLogsWithUpdate = (
  logs: CombatLogEntry[],
  update: GameCombatUpdateEvent
): CombatLogEntry[] => {
  const updateLogId = extractCombatLogId(update)
  if (updateLogId == null) {
    return logs
  }

  const existingLogIds = new Set<number>(
    logs.map(log => extractCombatLogId(log)).filter((id): id is number => id != null)
  )
  if (existingLogIds.has(updateLogId)) {
    return logs
  }

  const normalizedLog = { ...update, id: updateLogId } as CombatLogEntry
  return [normalizedLog, ...logs].slice(0, 100)
}

function isPersistedCombatLog(log: CombatLogEntry): log is CombatLog & PersistedCombatLogFields {
  return 'created_at' in log && typeof log.created_at === 'string'
}

function readRelationName(
  relation:
    | CombatLog['map']
    | CombatLog['monster']
    | CombatResult['monster']
    | string
    | null
    | undefined
): string {
  if (relation && typeof relation === 'object' && 'name' in relation && relation.name) {
    return String(relation.name)
  }
  if (typeof relation === 'string' && relation.trim().length > 0) {
    return relation
  }
  return '?'
}

/** 战斗日志列表/API 与 WebSocket 推送的 monster 字段格式不一致，统一解析怪物名 */
export function getCombatLogMonsterName(log: CombatLogEntry): string {
  const name = readRelationName('monster' in log ? log.monster : null)
  if (name !== '?') return name

  if ('monsters' in log && Array.isArray(log.monsters)) {
    const firstNamed = log.monsters.find(
      m => m != null && typeof m.name === 'string' && m.name.trim().length > 0
    )
    if (firstNamed?.name) return firstNamed.name
  }

  return '?'
}

function readRelationId(relation: CombatLog['map'] | CombatLog['monster'], fallback = 0): number {
  if (relation && typeof relation === 'object' && 'id' in relation && relation.id != null) {
    return Number(relation.id)
  }
  return fallback
}

/** API 拉取失败时，用列表里已有的日志条目拼装详情（兼容本地 API 与远端 WebSocket 不一致） */
export function buildCombatLogDetailFromEntry(
  log: CombatLogEntry,
  logId: number
): CombatLogDetail | null {
  if (isPersistedCombatLog(log)) {
    return {
      id: logId,
      map: {
        id: readRelationId(log.map, log.map_id ?? 0),
        name: readRelationName(log.map) || '未知地图',
      },
      monster: {
        id: readRelationId(log.monster, log.monster_id ?? 0),
        name: readRelationName(log.monster),
      },
      victory: log.victory,
      damage_dealt: log.damage_dealt,
      damage_taken: log.damage_taken,
      experience_gained: log.experience_gained,
      copper_gained: log.copper_gained,
      duration_seconds: log.duration_seconds ?? 0,
      skills_used: log.skills_used ?? [],
      loot_dropped: log.loot_dropped ?? log.loot ?? null,
      round_regen: log.round_regen ?? null,
      created_at: log.created_at,
      character: {
        level: log.character_level ?? 0,
        class: log.character_class ?? '?',
        attack: log.character_attack ?? 0,
        defense: log.character_defense ?? 0,
        crit_rate: log.character_crit_rate ?? 0,
        crit_damage: log.character_crit_damage ?? 0,
      },
      monster_stats: {
        level: log.monster_level ?? 0,
        hp: log.monster_hp ?? 0,
        max_hp: log.monster_max_hp ?? 0,
        attack: log.monster_attack ?? 0,
        defense: log.monster_defense ?? 0,
        experience: log.monster_experience ?? 0,
        copper: log.monster_copper ?? 0,
      },
      damage_detail: {
        base_attack: log.base_attack_damage ?? 0,
        skill_damage: log.skill_damage ?? 0,
        crit_damage: log.crit_damage ?? 0,
        aoe_damage: log.aoe_damage ?? 0,
        total: log.total_damage_to_monsters ?? log.damage_dealt ?? 0,
        defense_reduction: log.monster_defense_reduction ?? 0,
        defense_reduction_percent:
          log.monster_defense_reduction_percent ??
          (log.monster_defense_reduction != null ? log.monster_defense_reduction * 100 : 0),
        counter_damage: log.monster_counter_damage ?? 0,
      },
      battle: {
        round: log.round_number ?? 0,
        alive_count: log.monsters_alive_count ?? 0,
        killed_count: log.monsters_killed_count ?? 0,
      },
      difficulty: {
        tier: log.difficulty_tier ?? 0,
        multiplier: log.difficulty_multiplier ?? 1,
      },
    }
  }

  const result = log as CombatResult
  if (!result.monster && !result.character) {
    return null
  }

  return {
    id: logId,
    map: { id: 0, name: '未知地图' },
    monster: {
      id: result.monster_id ?? 0,
      name: result.monster?.name ?? '?',
    },
    victory: result.victory,
    damage_dealt: result.damage_dealt,
    damage_taken: result.damage_taken,
    experience_gained: result.experience_gained,
    copper_gained: result.copper_gained,
    duration_seconds: 0,
    skills_used: result.skills_used ?? [],
    loot_dropped: result.loot?.item ? { item: result.loot.item } : null,
    round_regen: result.round_regen ?? null,
    created_at: new Date().toISOString(),
    character: {
      level: result.character?.level ?? 0,
      class: result.character?.class ?? '?',
      attack: 0,
      defense: 0,
      crit_rate: 0,
      crit_damage: 0,
    },
    monster_stats: {
      level: result.monster?.level ?? 0,
      hp: result.monster?.hp ?? 0,
      max_hp: result.monster?.max_hp ?? 0,
      attack: 0,
      defense: 0,
      experience: 0,
      copper: 0,
    },
    damage_detail: {
      base_attack: result.damage_dealt,
      skill_damage: 0,
      crit_damage: 0,
      aoe_damage: 0,
      total: result.damage_dealt,
      defense_reduction: 0,
      counter_damage: result.damage_taken,
    },
    battle: {
      round: result.rounds ?? 0,
      alive_count: 0,
      killed_count: result.victory ? 1 : 0,
    },
    difficulty: {
      tier: result.character?.difficulty_tier ?? 0,
      multiplier: 1,
    },
  }
}
