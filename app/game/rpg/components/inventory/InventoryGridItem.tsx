'use client'

import { memo, useCallback } from 'react'
import type { GameItem } from '../../types'
import { getItemDisplayName } from '../../utils/itemUtils'
import { GameItemSlot } from './GameItemSlot'
import type { InventorySlotCell } from './inventoryUtils'

interface InventoryGridItemProps {
  cell: InventorySlotCell & { item: GameItem }
  isLoading: boolean
  onSelectedItemChange: (item: GameItem | null) => void
  selectedItemId: number | null
}

export const InventoryGridItem = memo(function InventoryGridItem({
  cell,
  isLoading,
  onSelectedItemChange,
  selectedItemId,
}: InventoryGridItemProps) {
  const item = cell.item
  const isSelected = selectedItemId === item.id

  const handleClick = useCallback(() => {
    onSelectedItemChange(isSelected ? null : item)
  }, [isSelected, item, onSelectedItemChange])

  return (
    <GameItemSlot
      item={item}
      onClick={handleClick}
      title={getItemDisplayName(item)}
      variant="inventory"
      isSelected={isSelected}
      disabled={isLoading}
      footer={
        <div className="absolute -bottom-0.5 flex w-full items-center justify-center">
          <span className="rounded bg-black/70 px-1 text-[9px] font-medium text-yellow-400">
            {(item.sell_price ?? Math.floor((item.definition?.buy_price ?? 0) / 2)) *
              (item.quantity ?? 1)}
          </span>
        </div>
      }
    />
  )
})
