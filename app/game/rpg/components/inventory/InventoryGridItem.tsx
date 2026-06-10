'use client'

import { memo, useCallback } from 'react'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { type ItemActionType } from '@/components/game'
import type { GameItem } from '../../types'
import { getItemDisplayName, isEquippable } from '../../utils/itemUtils'
import { GameItemSlot } from './GameItemSlot'
import {
  getInventoryDetailPopoverWidth,
  InventoryItemDetailContent,
} from './InventoryItemDetailContent'
import type { InventorySlotCell } from './inventoryUtils'

const POPOVER_COLLISION_PADDING = { top: 12, right: 12, left: 12, bottom: 72 }

interface InventoryGridItemProps {
  canSocket: (item: GameItem) => boolean
  canUnsocket: (item: GameItem) => boolean
  cell: InventorySlotCell & { item: GameItem }
  gemsInInventoryCount: number
  getCompareActions: (item: GameItem) => ItemActionType[]
  getEquippedItem: (item: GameItem) => GameItem | null
  getEquippedRings: () => GameItem[]
  handleCompareAction: (action: ItemActionType, item: GameItem) => void
  hasEquippedItem: (item: GameItem) => boolean
  isLoading: boolean
  onEquip: () => void
  onMove: (toStorage: boolean) => void
  onOpenGemSelector: (item: GameItem) => void
  onSelectedItemChange: (item: GameItem | null) => void
  onSell: () => void
  onUnsocketGem: (socketIndex: number) => void
  onUsePotion: () => void
  selectedItemId: number | null
}

export const InventoryGridItem = memo(function InventoryGridItem({
  canSocket,
  canUnsocket,
  cell,
  gemsInInventoryCount,
  getCompareActions,
  getEquippedItem,
  getEquippedRings,
  handleCompareAction,
  hasEquippedItem,
  isLoading,
  onEquip,
  onMove,
  onOpenGemSelector,
  onSelectedItemChange,
  onSell,
  onUnsocketGem,
  onUsePotion,
  selectedItemId,
}: InventoryGridItemProps) {
  const item = cell.item
  const isSelected = selectedItemId === item.id
  const showCompare = isEquippable(item) && cell.source === 'inventory' && hasEquippedItem(item)
  const equippedRings = item.definition?.type === 'ring' ? getEquippedRings() : []
  const popoverWidth = getInventoryDetailPopoverWidth(item, showCompare, equippedRings.length)

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onSelectedItemChange(null)
    },
    [onSelectedItemChange]
  )

  const handleClick = useCallback(() => {
    onSelectedItemChange(isSelected ? null : item)
  }, [isSelected, item, onSelectedItemChange])

  const handleClose = useCallback(() => {
    onSelectedItemChange(null)
  }, [onSelectedItemChange])

  return (
    <Popover open={isSelected} onOpenChange={handleOpenChange}>
      <PopoverAnchor asChild>
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
      </PopoverAnchor>
      <PopoverContent
        className={`${popoverWidth} max-w-[95vw] p-0`}
        side="bottom"
        align="center"
        sideOffset={8}
        collisionPadding={POPOVER_COLLISION_PADDING}
        onOpenAutoFocus={event => event.preventDefault()}
      >
        <InventoryItemDetailContent
          canSocket={canSocket}
          canUnsocket={canUnsocket}
          gemsInInventoryCount={gemsInInventoryCount}
          getCompareActions={getCompareActions}
          getEquippedItem={getEquippedItem}
          getEquippedRings={getEquippedRings}
          handleCompareAction={handleCompareAction}
          hasEquippedItem={hasEquippedItem}
          isLoading={isLoading}
          item={item}
          onClose={handleClose}
          onEquip={onEquip}
          onMove={onMove}
          onOpenGemSelector={onOpenGemSelector}
          onSell={onSell}
          onUnsocketGem={onUnsocketGem}
          onUsePotion={onUsePotion}
          source={cell.source}
        />
      </PopoverContent>
    </Popover>
  )
})
