'use client'

import type { GameItem } from '@/app/game/rpg/types'
import { ItemDetailContent } from './ItemDetailContent'
import { FullComparePanel } from './ItemComparePanel'
import { ItemActions, type ItemActionType } from './ItemActions'
import { isEquippable } from '@/app/game/rpg/utils/itemUtils'
import { useGameStore } from '@/app/game/rpg/stores/gameStore'
import { getFullComparePanelWidthClass } from '@/app/game/rpg/utils/comparePanelUtils'

interface BaseItemDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: GameItem | null
}

interface InventoryItemDetailModalProps extends BaseItemDetailModalProps {
  type: 'inventory'
  source: 'inventory' | 'storage'
  equippedItem?: GameItem | null
  onEquip?: () => void
  onUse?: () => void
  onMove?: (toStorage: boolean) => void
  onSell?: () => void
}

interface EquipmentItemDetailModalProps extends BaseItemDetailModalProps {
  type: 'equipment'
  onUnequip?: () => void
}

export type ItemDetailModalProps = InventoryItemDetailModalProps | EquipmentItemDetailModalProps

function usesWideCompareLayout(props: ItemDetailModalProps): boolean {
  if (!props.item || props.type !== 'inventory') return false
  return props.source === 'inventory' && props.equippedItem != null && isEquippable(props.item)
}

export function ItemDetailModal(props: ItemDetailModalProps) {
  const { isOpen, onClose, item } = props
  const compareEquippedCollapsed = useGameStore(state => state.compareEquippedCollapsed)

  if (!isOpen || !item) return null

  const isWideCompare = usesWideCompareLayout(props)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className={`relative max-w-[calc(100vw-2rem)] text-sm ${
          isWideCompare
            ? getFullComparePanelWidthClass(compareEquippedCollapsed)
            : 'border-border bg-card w-[280px] rounded-xl border shadow-2xl'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-2 right-2 z-20">
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {props.type === 'inventory' && <InventoryItemDetail {...props} />}
        {props.type === 'equipment' && <EquipmentItemDetail {...props} />}
      </div>
    </div>
  )
}

function InventoryItemDetail(props: InventoryItemDetailModalProps) {
  const { item, source, equippedItem, onEquip, onUse, onMove, onSell } = props

  if (!item) return null

  const hasEquipped = source === 'inventory' && equippedItem != null && isEquippable(item)

  const getActions = (): ItemActionType[] => {
    const actions: ItemActionType[] = []

    if (source === 'inventory') {
      if (isEquippable(item)) {
        actions.push('equip')
      }
      actions.push('store')
      actions.push('sell')
    } else {
      actions.push('retrieve')
    }

    return actions
  }

  const handleAction = (action: ItemActionType) => {
    switch (action) {
      case 'equip':
        onEquip?.()
        break
      case 'use':
        onUse?.()
        break
      case 'store':
        onMove?.(true)
        break
      case 'retrieve':
        onMove?.(false)
        break
      case 'sell':
        onSell?.()
        break
    }
  }

  const actions = getActions()

  if (hasEquipped && equippedItem) {
    return (
      <FullComparePanel
        newItem={item}
        equippedItem={equippedItem}
        actions={actions}
        onAction={handleAction}
      />
    )
  }

  return (
    <div className="flex flex-col">
      <ItemDetailContent item={item} type="inventory" />
      <ItemActions actions={actions} onAction={handleAction} />
    </div>
  )
}

function EquipmentItemDetail(props: EquipmentItemDetailModalProps) {
  const { item, onUnequip } = props

  if (!item) return null

  const handleAction = (action: ItemActionType) => {
    if (action === 'unequip') {
      onUnequip?.()
    }
  }

  return (
    <div className="flex flex-col">
      <ItemDetailContent item={item} type="equipment" />
      <ItemActions actions={['unequip']} onAction={handleAction} />
    </div>
  )
}
