'use client'

import { cn } from '@/lib/helpers'

const DOTS: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [
    [30, 30],
    [70, 70],
  ],
  3: [
    [30, 30],
    [50, 50],
    [70, 70],
  ],
  4: [
    [30, 30],
    [70, 30],
    [30, 70],
    [70, 70],
  ],
  5: [
    [30, 30],
    [70, 30],
    [50, 50],
    [30, 70],
    [70, 70],
  ],
  6: [
    [30, 25],
    [70, 25],
    [30, 50],
    [70, 50],
    [30, 75],
    [70, 75],
  ],
}

export function Dice({ value, rolling = false }: { value: number; rolling?: boolean }) {
  const safeValue = Math.min(6, Math.max(1, value || 1))

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={`骰子 ${safeValue} 点`}
      data-testid="monopoly-dice"
      className={cn(
        'size-16 rounded-lg drop-shadow-sm transition-[transform,filter] duration-200',
        rolling &&
          'animate-[monopoly-dice-roll_0.55s_cubic-bezier(0.4,0,0.2,1)_infinite] drop-shadow-[0_8px_8px_rgba(15,23,42,0.28)]'
      )}
    >
      <rect
        x="8"
        y="8"
        width="84"
        height="84"
        rx="14"
        fill="#f8fafc"
        stroke="#111827"
        strokeWidth="5"
      />
      {DOTS[safeValue].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="7.5" fill="#111827" />
      ))}
    </svg>
  )
}
