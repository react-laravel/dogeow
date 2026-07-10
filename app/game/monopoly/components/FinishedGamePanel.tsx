import { Trophy } from 'lucide-react'
import type { MonopolyEvent } from '../types'
import { EventLogPanel } from './EventLogPanel'

interface FinishedGamePanelProps {
  events: MonopolyEvent[]
  maxRounds: number
}

export function FinishedGamePanel({ events, maxRounds }: FinishedGamePanelProps) {
  const finishedEvent = [...events].reverse().find(event => event.type === 'game.finished')

  return (
    <div className="flex size-full flex-col gap-3 overflow-hidden rounded-md bg-white/75 p-4 dark:bg-stone-950/45">
      <div className="flex shrink-0 flex-col items-center gap-3 text-center">
        <Trophy className="size-10 text-amber-500" />
        <div className="min-w-0 max-w-full">
          <div className="truncate text-lg font-semibold text-stone-950 dark:text-stone-50">
            游戏结束
          </div>
          <div className="mt-2 text-sm text-stone-600 dark:text-stone-300">
            {finishedEvent?.message ?? `已完成第 ${maxRounds} 轮结算`}
          </div>
        </div>
      </div>
      <EventLogPanel events={events} />
    </div>
  )
}
