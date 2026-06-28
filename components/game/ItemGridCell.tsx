'use client'

import type { GameItem, ItemQuality } from '@/app/game/rpg/types'
import { QUALITY_COLORS } from '@/app/game/rpg/types'
import { ItemIcon } from './ItemIcon'
import { getItemDisplayName } from '@/app/game/rpg/utils/itemUtils'

interface ItemGridCellProps {
  item: GameItem
  isSelected?: boolean
  onClick?: () => void
  disabled?: boolean
  showPrice?: boolean
}

/** 物品格子组件 */
export function ItemGridCell({
  item,
  isSelected,
  onClick,
  disabled,
  showPrice = false,
}: ItemGridCellProps) {
  const quality = item.quality
  const borderColor = isSelected ? undefined : QUALITY_COLORS[quality as ItemQuality]
  const price = item.sell_price
  const quantity = item.quantity ?? 1
  const totalPrice = (price ?? 0) * quantity
  const displayName = getItemDisplayName(item)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex h-14 w-14 shrink-0 flex-col rounded border-2 transition-all hover:scale-105 ${
        isSelected
          ? 'border-green-500 bg-green-500/20 shadow-lg shadow-green-500/50 dark:border-green-400 dark:bg-green-400/20'
          : 'bg-muted/50 hover:border-muted-foreground/30 hover:bg-muted'
      }`}
      style={borderColor ? { borderColor } : undefined}
      title={displayName}
    >
      <span className="flex min-h-0 flex-1 items-center justify-center text-lg">
        <ItemIcon item={item} className="drop-shadow-sm" />
        {quantity > 1 && (
          <span className="absolute top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded bg-black/70 text-[10px] font-bold text-white">
            {quantity}
          </span>
        )}
      </span>
      {showPrice && totalPrice > 0 && (
        <span className="border-border/50 bg-muted/80 flex shrink-0 items-center justify-center overflow-hidden rounded-b-[calc(0.2rem-2px)] border-t px-1.5 py-1">
          <span className="text-[9px] font-medium text-yellow-400">{totalPrice}</span>
        </span>
      )}
    </button>
  )
}

/** 空物品格子 */
export function EmptyGridCell() {
  return (
    <div
      className="border-border bg-card flex h-10 w-10 shrink-0 items-center justify-center rounded border-2 border-dashed"
      aria-hidden
    />
  )
}

/** 装备槽位格子 */
export function EquipmentSlotCell({
  slot,
  item,
  onClick,
  label,
}: {
  slot: string
  item: GameItem | null | undefined
  onClick: () => void
  label?: string
}) {
  const borderColor = item ? QUALITY_COLORS[item.quality as ItemQuality] : undefined

  return (
    <button
      onClick={onClick}
      disabled={!item}
      className={`relative flex h-12 w-12 items-center justify-center rounded border-2 text-xl shadow-sm transition-all ${
        item
          ? 'bg-secondary cursor-pointer hover:shadow-md'
          : 'border-border bg-card cursor-default border-dashed'
      }`}
      style={borderColor ? { borderColor } : undefined}
      title={item ? getItemDisplayName(item) : label || slot}
    >
      {item ? (
        <ItemIcon item={item} className="drop-shadow-sm" />
      ) : (
        <span className="text-muted-foreground text-xs">{label || slot}</span>
      )}
    </button>
  )
}
