'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/helpers'
import type { MonopolyEvent } from '../types'

interface EventLogPanelProps {
  events: MonopolyEvent[]
  className?: string
}

export function EventLogPanel({ events, className = '' }: EventLogPanelProps) {
  const logContainerRef = useRef<HTMLDivElement | null>(null)
  const latestEventId = events[events.length - 1]?.id

  useEffect(() => {
    const element = logContainerRef.current
    if (!element) return

    element.scrollTo?.({ top: element.scrollHeight, behavior: 'smooth' })
  }, [latestEventId])

  return (
    <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${className}`}>
      <div className="shrink-0 text-xs font-medium text-stone-500 dark:text-stone-400">事件</div>
      <div
        ref={logContainerRef}
        className="mt-2 grid min-h-0 flex-1 content-start gap-1.5 overflow-auto pr-1 text-sm leading-snug"
      >
        {events.length === 0 ? (
          <div className="rounded-md bg-stone-50 px-2 py-4 text-center text-stone-500 dark:bg-stone-900 dark:text-stone-400">
            暂无事件
          </div>
        ) : (
          events.map((event, index) => (
            <div
              key={event.id}
              className={cn(
                'relative rounded-md bg-stone-50 py-1.5 pr-2 pl-3 text-stone-700 transition-colors dark:bg-stone-900 dark:text-stone-300',
                index === events.length - 1 &&
                  'animate-in fade-in slide-in-from-bottom-1 bg-amber-50 dark:bg-amber-950/25'
              )}
              data-latest={index === events.length - 1 ? 'true' : undefined}
            >
              <span
                className={cn(
                  'absolute top-2 bottom-2 left-1 w-0.5 rounded-full bg-stone-300 dark:bg-stone-700',
                  event.type.startsWith('property.') && 'bg-emerald-500',
                  (event.type.startsWith('chance.') || event.type.startsWith('welfare.')) &&
                    'bg-sky-500',
                  (event.type.startsWith('rent.') || event.type.startsWith('cash.')) &&
                    'bg-amber-500',
                  (event.type.startsWith('jail.') || event.type === 'player.bankrupt') &&
                    'bg-red-500'
                )}
              />
              {event.message}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
