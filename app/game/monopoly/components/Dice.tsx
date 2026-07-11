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
        'monopoly-dice size-16 drop-shadow-[0_2px_2px_rgba(28,25,23,0.18)]',
        rolling && 'monopoly-dice-roll'
      )}
    >
      <rect
        x="8"
        y="8"
        width="84"
        height="84"
        rx="14"
        fill="#fffdf8"
        stroke="#292524"
        strokeWidth="4"
      />
      {DOTS[safeValue].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="7.5" fill="#292524" />
      ))}
    </svg>
  )
}
