'use client'

import { forwardRef, memo, type ReactNode } from 'react'
import { ItemIcon } from '@/components/game'
import type { GameItem } from '../../types'
import { QUALITY_COLORS } from '../../types'
import { ItemSocketIndicators } from './ItemSocketIndicators'
import { ItemUpgradeIndicator } from './ItemUpgradeIndicator'

type SlotVariant = 'inventory' | 'equipment'

interface GameItemSlotProps {
  disabled?: boolean
  emptyLabel?: string
  footer?: ReactNode
  isSelected?: boolean
  item: GameItem | null | undefined
  showUpgradeIndicator?: boolean
  onClick: () => void
  title: string
  variant: SlotVariant
}

export const GameItemSlot = memo(
  forwardRef<HTMLDivElement, GameItemSlotProps>(function GameItemSlot(
    {
      disabled = false,
      emptyLabel,
      footer,
      isSelected = false,
      item,
      onClick,
      showUpgradeIndicator = false,
      title,
      variant,
    },
    ref
  ) {
    if (variant === 'inventory' && item) {
      return (
        <div
          ref={ref}
          className={`relative flex h-14 w-12 shrink-0 flex-col items-center rounded border-2 shadow-sm transition-all hover:shadow-md ${
            isSelected ? '' : 'border-border'
          }`}
          style={{
            background: isSelected
              ? undefined
              : `linear-gradient(135deg, ${QUALITY_COLORS[item.quality]}15 0%, ${QUALITY_COLORS[item.quality]}08 100%)`,
            borderColor: QUALITY_COLORS[item.quality],
          }}
          title={title}
        >
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="relative flex h-10 w-full items-center justify-center overflow-hidden text-lg disabled:opacity-50"
          >
            <FilledSlotContent
              item={item}
              showQuantityBadge
              showUpgradeIndicator={showUpgradeIndicator}
            />
          </button>
          {footer}
        </div>
      )
    }

    const borderColor = item ? QUALITY_COLORS[item.quality] : undefined

    return (
      <button
        onClick={onClick}
        disabled={!item}
        className={`relative flex h-12 w-12 items-center justify-center rounded border-2 text-xl shadow-sm transition-all ${
          item
            ? 'cursor-pointer bg-black/65 hover:bg-black/75 hover:shadow-md'
            : 'border-border cursor-default border-dashed bg-black/50'
        }`}
        style={borderColor ? { borderColor } : undefined}
        title={title}
      >
        {item ? (
          <>
            <FilledSlotContent item={item} />
            {footer}
          </>
        ) : (
          <EmptySlotLabel label={emptyLabel} />
        )}
      </button>
    )
  })
)

function FilledSlotContent({
  item,
  showQuantityBadge = false,
  showUpgradeIndicator = false,
}: {
  item: GameItem
  showQuantityBadge?: boolean
  showUpgradeIndicator?: boolean
}) {
  return (
    <>
      <ItemIcon item={item} className="drop-shadow-sm" />
      {showUpgradeIndicator && <ItemUpgradeIndicator />}
      {showQuantityBadge && item.quantity > 1 && (
        <span className="absolute top-0 right-0 z-10 max-w-full truncate rounded-bl bg-black/70 px-0.5 text-[8px] leading-none font-bold text-white tabular-nums">
          {item.quantity}
        </span>
      )}
      <ItemSocketIndicators item={item} className="absolute -top-1 -right-1 z-10" />
    </>
  )
}

function EmptySlotLabel({ label }: { label?: string }) {
  return <span className="text-muted-foreground text-xs">{label}</span>
}
