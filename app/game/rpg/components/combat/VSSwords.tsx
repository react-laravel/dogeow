'use client'

import styles from '../../rpg.module.css'

/** VS 区域：可点击的 emoji，未战斗静止、战斗中播放动画；死亡时显示复活 */
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

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isLoading}
      className={`text-primary hover:text-primary/90 focus-visible:ring-ring flex w-fit shrink-0 items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 disabled:opacity-50 ${
        isInline
          ? 'flex-row gap-1 rounded-md px-1.5 py-1 text-xs sm:gap-1.5 sm:px-2'
          : 'flex-col gap-0.5 self-center py-1'
      }`}
      title={isCharacterDead ? '复活继续' : isFighting ? '停止挂机' : '开始挂机'}
      aria-label={isCharacterDead ? '复活继续' : isFighting ? '停止挂机' : '开始挂机'}
    >
      <span
        className={`flex items-center justify-center leading-none ${
          isInline ? 'h-5 text-lg sm:h-6 sm:text-xl' : 'h-8 text-3xl sm:h-10 sm:text-4xl'
        } ${!isCharacterDead && isFighting ? styles['vs-emoji-fighting'] : ''}`}
        aria-hidden
      >
        {isCharacterDead ? '💪' : '⚔️'}
      </span>
      <span
        className={`text-primary whitespace-nowrap font-bold ${
          isInline ? 'text-xs sm:text-sm' : 'text-xs sm:text-sm'
        }`}
      >
        {isCharacterDead ? '复活' : isFighting ? '战斗中...' : '已停止战斗'}
      </span>
    </button>
  )
}
