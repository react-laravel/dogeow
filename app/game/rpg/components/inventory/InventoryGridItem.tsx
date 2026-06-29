'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { type ItemActionType } from '@/components/game'
import type { GameItem } from '../../types'
import { getItemDisplayName, isEquippable } from '../../utils/itemUtils'
import { GameItemSlot } from './GameItemSlot'
import { shouldShowUpgradeIndicator } from './inventoryEquipmentUtils'
import {
  getInventoryDetailPopoverWidth,
  InventoryItemDetailContent,
} from './InventoryItemDetailContent'
import { ItemSlotSellPriceBadge } from './ItemSlotSellPriceBadge'
import type { InventorySlotCell } from './inventoryUtils'
import { useGameStore } from '../../stores/gameStore'

const DETAIL_PANEL_ESTIMATED_HEIGHT = 280
const DETAIL_PANEL_BOTTOM_PADDING = 88

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
  selectedItemId,
}: InventoryGridItemProps) {
  const item = cell.item
  const slotRef = useRef<HTMLDivElement | null>(null)
  const [detailPanelTop, setDetailPanelTop] = useState(0)
  const isSelected = selectedItemId === item.id
  const showCompare = isEquippable(item) && cell.source === 'inventory' && hasEquippedItem(item)
  const equippedItem =
    cell.source === 'inventory' && isEquippable(item) ? getEquippedItem(item) : null
  const showUpgradeIndicator = shouldShowUpgradeIndicator(item, equippedItem)
  const compareEquippedCollapsed = useGameStore(state => state.compareEquippedCollapsed)
  const popoverWidth = getInventoryDetailPopoverWidth(showCompare, compareEquippedCollapsed)

  const handleClick = useCallback(() => {
    if (!isSelected) {
      setDetailPanelTop(getCenteredDetailTop(slotRef.current))
    }
    onSelectedItemChange(isSelected ? null : item)
  }, [isSelected, item, onSelectedItemChange])

  const handleClose = useCallback(() => {
    onSelectedItemChange(null)
  }, [onSelectedItemChange])

  useEffect(() => {
    if (!isSelected || showCompare) return

    const updateTop = () => setDetailPanelTop(getCenteredDetailTop(slotRef.current))

    window.addEventListener('resize', updateTop)
    return () => window.removeEventListener('resize', updateTop)
  }, [isSelected, showCompare])

  const detailContent = (
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
      source={cell.source}
    />
  )

  return (
    <>
      <GameItemSlot
        ref={slotRef}
        item={item}
        onClick={handleClick}
        title={getItemDisplayName(item)}
        variant="inventory"
        isSelected={isSelected}
        disabled={isLoading}
        showUpgradeIndicator={showUpgradeIndicator}
        footer={<ItemSlotSellPriceBadge item={item} />}
      />
      {isSelected &&
        typeof document !== 'undefined' &&
        createPortal(
          showCompare ? (
            <div
              className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4"
              onClick={handleClose}
            >
              <div
                className={`relative max-w-[calc(100vw-2rem)] text-sm ${popoverWidth}`}
                onClick={event => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground absolute top-2 right-2 z-20 rounded p-1 transition-colors"
                  aria-label="关闭"
                >
                  ✕
                </button>
                {detailContent}
              </div>
            </div>
          ) : (
            <>
              <div
                className="fixed inset-0 z-[149] bg-black/70"
                onClick={handleClose}
                aria-hidden="true"
              />
              <div
                className="fixed left-1/2 z-[150] w-[280px] max-w-[calc(100vw-24px)] -translate-x-1/2 rounded-md border bg-background text-foreground shadow-md"
                style={{ top: detailPanelTop }}
                onClick={event => event.stopPropagation()}
              >
                {detailContent}
              </div>
            </>
          ),
          document.body
        )}
    </>
  )
})

function getCenteredDetailTop(slot: HTMLDivElement | null): number {
  if (!slot) return 12

  const rect = slot.getBoundingClientRect()
  const belowTop = rect.bottom + 8
  const maxBottom = window.innerHeight - DETAIL_PANEL_BOTTOM_PADDING

  if (belowTop + DETAIL_PANEL_ESTIMATED_HEIGHT <= maxBottom) {
    return Math.max(12, belowTop)
  }

  return Math.max(12, rect.top - DETAIL_PANEL_ESTIMATED_HEIGHT - 8)
}
