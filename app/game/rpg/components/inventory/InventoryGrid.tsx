'use client'

import { type GameItem } from '../../types'
import { InventoryGridItem } from './InventoryGridItem'
import { type InventorySlotCell } from './inventoryUtils'

interface InventoryGridProps {
  displaySlots: InventorySlotCell[]
  isLoading: boolean
  onSelectedItemChange: (item: GameItem | null) => void
  selectedItemId: number | null
}

export function InventoryGrid({
  displaySlots,
  isLoading,
  onSelectedItemChange,
  selectedItemId,
}: InventoryGridProps) {
  return (
    <div className="mx-auto min-h-0 flex-1 overflow-auto p-1">
      <div className="flex w-[20.5rem] flex-wrap gap-x-2 gap-y-2 sm:w-[26.5rem]">
        {displaySlots.map((cell, index) => {
          if (!cell.item) return <EmptySlot key={`empty-${index}`} />

          const item = cell.item

          return (
            <InventoryGridItem
              key={item.id}
              cell={{ ...cell, item }}
              isLoading={isLoading}
              onSelectedItemChange={onSelectedItemChange}
              selectedItemId={selectedItemId}
            />
          )
        })}
      </div>
    </div>
  )
}

function EmptySlot() {
  return (
    <div
      className="border-border bg-card flex h-14 w-12 shrink-0 items-center justify-center rounded border-2 border-dashed"
      aria-hidden
    />
  )
}
