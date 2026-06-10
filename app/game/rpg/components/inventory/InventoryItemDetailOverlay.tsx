'use client'

import { FullComparePanel, type ItemActionType } from '@/components/game'
import type { GameItem } from '../../types'
import { isEquippable } from '../../utils/itemUtils'
import { InventoryDetailActions } from './InventoryDetailActions'
import { InventoryItemDetailCard } from './InventoryItemDetailCard'
import type { InventorySlotCell } from './inventoryUtils'

interface InventoryItemDetailOverlayProps {
  canSocket: (item: GameItem) => boolean
  canUnsocket: (item: GameItem) => boolean
  gemsInInventoryCount: number
  getCompareActions: (item: GameItem) => ItemActionType[]
  getEquippedItem: (item: GameItem) => GameItem | null
  getEquippedRings: () => GameItem[]
  handleCompareAction: (action: ItemActionType, item: GameItem) => void
  hasEquippedItem: (item: GameItem) => boolean
  isLoading: boolean
  item: GameItem | null
  onClose: () => void
  onEquip: () => void
  onMove: (toStorage: boolean) => void
  onOpenGemSelector: (item: GameItem) => void
  onSell: () => void
  onUnsocketGem: (socketIndex: number) => void
  onUsePotion: () => void
  source: InventorySlotCell['source']
}

export function InventoryItemDetailOverlay({
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
  onUsePotion,
  source,
}: InventoryItemDetailOverlayProps) {
  if (!item) return null

  const showCompare = isEquippable(item) && source === 'inventory' && hasEquippedItem(item)
  const equippedRings = item.definition?.type === 'ring' ? getEquippedRings() : []
  const compareActions = showCompare ? getCompareActions(item) : []
  const overlayWidth =
    showCompare && item.definition?.type === 'ring' && equippedRings.length === 2
      ? 'max-w-[840px]'
      : showCompare
        ? 'max-w-[420px]'
        : 'max-w-[280px]'

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-card border-border w-full ${overlayWidth} rounded-lg border shadow-xl`}
        onClick={event => event.stopPropagation()}
      >
        <div className="flex flex-col">
          {showCompare && (
            <>
              {item.definition?.type === 'ring' &&
                equippedRings.length === 2 &&
                equippedRings.map(equippedRing => (
                  <FullComparePanel
                    key={equippedRing.id}
                    newItem={item}
                    equippedItem={equippedRing}
                    actions={compareActions}
                    onAction={action => handleCompareAction(action, item)}
                  />
                ))}
              {(item.definition?.type !== 'ring' || equippedRings.length !== 2) && (
                <FullComparePanel
                  newItem={item}
                  equippedItem={getEquippedItem(item)!}
                  actions={compareActions}
                  onAction={action => handleCompareAction(action, item)}
                />
              )}
            </>
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
                  onUsePotion={onUsePotion}
                  source={source}
                />
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}
