'use client'

import { LoaderCircle, RotateCcw, Square, Swords } from 'lucide-react'
import styles from '../../rpg.module.css'

/** 战斗状态按钮：开始、停止与复活使用一致的图标和状态反馈。 */
export function VSSwords({
  isFighting,
  isLoading,
  isDead,
  onToggle,
  variant = 'stacked',
}: {
  isFighting: boolean
  isLoading: boolean
  isDead?: boolean
  onToggle: () => void
  variant?: 'stacked' | 'inline'
}) {
  const isCharacterDead = isDead ?? false
  const isInline = variant === 'inline'
  const label = isCharacterDead
    ? '复活'
    : isLoading
      ? '准备中'
      : isFighting
        ? '停止战斗'
        : '开始战斗'
  const Icon = isCharacterDead ? RotateCcw : isLoading ? LoaderCircle : isFighting ? Square : Swords

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isLoading}
      className={`focus-visible:ring-ring flex w-fit shrink-0 items-center justify-center font-semibold transition-[background-color,color,border-color,transform] focus:outline-none focus-visible:ring-2 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 ${
        isInline
          ? `h-9 flex-row gap-1.5 rounded-md border px-2.5 text-xs sm:px-3 sm:text-sm ${
              isCharacterDead
                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                : isFighting
                  ? 'border-red-500/40 bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-300'
                  : 'border-primary/40 bg-primary/15 text-primary hover:bg-primary/25'
            }`
          : 'text-primary flex-col gap-0.5 self-center py-1'
      }`}
      title={label}
      aria-label={label}
    >
      <span className="relative flex items-center justify-center" aria-hidden>
        {isFighting && !isCharacterDead && !isLoading && (
          <span className="absolute h-5 w-5 animate-ping rounded-full bg-red-500/25" />
        )}
        <Icon
          className={`${isInline ? 'h-4 w-4' : 'h-8 w-8'} ${isLoading ? 'animate-spin' : ''} ${!isCharacterDead && isFighting ? styles['vs-emoji-fighting'] : ''}`}
          fill={isFighting && !isLoading && !isCharacterDead ? 'currentColor' : 'none'}
        />
      </span>
      <span
        className={`whitespace-nowrap ${isInline ? 'max-[430px]:sr-only text-xs sm:text-sm' : 'text-xs sm:text-sm'}`}
      >
        {label}
      </span>
    </button>
  )
}
