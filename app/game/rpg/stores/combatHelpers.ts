import type { CombatLog, CombatResult, GameCombatUpdateEvent } from '../types'

export type CombatLogEntry = CombatResult | CombatLog

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

export const extractCombatLogId = (log: CombatLogEntry | GameCombatUpdateEvent): number | null => {
  if ('id' in log && typeof log.id === 'number') return log.id
  if ('combat_log_id' in log && typeof log.combat_log_id === 'number') return log.combat_log_id
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

export const hasPotionUsage = (update: GameCombatUpdateEvent): boolean => {
  const potionUsed = update.potion_used
  return !!(
    potionUsed &&
    ((potionUsed.before && Object.keys(potionUsed.before).length > 0) ||
      (potionUsed.after && Object.keys(potionUsed.after).length > 0))
  )
}
