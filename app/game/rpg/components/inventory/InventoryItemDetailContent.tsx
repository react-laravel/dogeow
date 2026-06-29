'use client'

import { FullComparePanel, type ItemActionType } from '@/components/game'
import type { GameItem } from '../../types'
import { isEquippable } from '../../utils/itemUtils'
import { InventoryDetailActions } from './InventoryDetailActions'
import { InventoryItemDetailCard } from './InventoryItemDetailCard'
import type { InventorySlotCell } from './inventoryUtils'
import { getFullComparePanelWidthClass } from '../../utils/comparePanelUtils'

interface InventoryItemDetailContentProps {
  canSocket: (item: GameItem) => boolean
  canUnsocket: (item: GameItem) => boolean
  gemsInInventoryCount: number
  getCompareActions: (item: GameItem) => ItemActionType[]
  getEquippedItem: (item: GameItem) => GameItem | null
  getEquippedRings: () => GameItem[]
  handleCompareAction: (action: ItemActionType, item: GameItem) => void
  hasEquippedItem: (item: GameItem) => boolean
  isLoading: boolean
  item: GameItem
  onClose: () => void
  onEquip: () => void
  onMove: (toStorage: boolean) => void
  onOpenGemSelector: (item: GameItem) => void
  onSell: () => void
  onUnsocketGem: (socketIndex: number) => void
  source: InventorySlotCell['source']
}

export function getInventoryDetailPopoverWidth(
  showCompare: boolean,
  compareEquippedCollapsed: boolean
) {
  if (showCompare) {
    return getFullComparePanelWidthClass(compareEquippedCollapsed)
  }
  return 'w-[280px]'
}

export function InventoryItemDetailContent({
  canSocket,
  canUnsocket,
  gemsInInventoryCount,
  getCompareActions,
  getEquippedItem,
  getEquippedRings,
  handleCompareAction,
  hasEquippedItem,
  isLoading,
  item,
  onClose,
  onEquip,
  onMove,
  onOpenGemSelector,
  onSell,
  onUnsocketGem,
  source,
}: InventoryItemDetailContentProps) {
  const showCompare = isEquippable(item) && source === 'inventory' && hasEquippedItem(item)
  const equippedRings = item.definition?.type === 'ring' ? getEquippedRings() : []
  const compareActions = showCompare ? getCompareActions(item) : []

  return (
    <div className="flex flex-col">
      {showCompare && (
        <div className="space-y-3">
          {item.definition?.type === 'ring' &&
            equippedRings.length === 2 &&
            equippedRings.map(equippedRing => (
              <FullComparePanel
                key={equippedRing.id}
                newItem={item}
                equippedItem={equippedRing}
                actions={compareActions}
                onAction={action => handleCompareAction(action, item)}
                onUnsocketGem={socketIndex => onUnsocketGem(socketIndex)}
              />
            ))}
          {(item.definition?.type !== 'ring' || equippedRings.length !== 2) && (
            <FullComparePanel
              newItem={item}
              equippedItem={getEquippedItem(item)!}
              actions={compareActions}
              onAction={action => handleCompareAction(action, item)}
              onUnsocketGem={socketIndex => onUnsocketGem(socketIndex)}
            />
          )}
        </div>
      )}
      {!showCompare && (
        <InventoryItemDetailCard
          item={item}
          onClose={onClose}
          onUnsocketGem={onUnsocketGem}
          isLoading={isLoading}
          showBuyPrice
          footer={
            <InventoryDetailActions
              canSocket={canSocket}
              canUnsocket={canUnsocket}
              gemsInInventoryCount={gemsInInventoryCount}
              isLoading={isLoading}
              item={item}
              onEquip={onEquip}
              onMove={onMove}
              onOpenGemSelector={onOpenGemSelector}
              onSell={onSell}
              onUnsocketGem={onUnsocketGem}
              source={source}
            />
          }
        />
      )}
    </div>
  )
}
