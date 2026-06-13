'use client'

import type { GameItem, ShopItem } from '@/app/game/rpg/types'
import { ItemDetailContent } from './ItemDetailContent'
import { FullComparePanel } from './ItemComparePanel'
import { ItemActions, type ItemActionType } from './ItemActions'
import { isEquippable, isPotion } from '@/app/game/rpg/utils/itemUtils'
import { CopperDisplay } from '@/app/game/rpg/components/shared/CopperDisplay'
import { useGameStore } from '@/app/game/rpg/stores/gameStore'
import { getFullComparePanelWidthClass } from '@/app/game/rpg/utils/comparePanelUtils'

interface BaseItemDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: GameItem | ShopItem | null
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

interface ShopItemDetailModalProps extends BaseItemDetailModalProps {
  type: 'shop'
  buyQuantity?: number
  setBuyQuantity?: (quantity: number) => void
  totalBuyPrice?: number
  onBuy?: () => void
  disabledBuy?: boolean
  canAfford?: boolean
  levelEnough?: boolean
  inventoryFull?: boolean
  equippedItem?: GameItem | null
}

interface EquipmentItemDetailModalProps extends BaseItemDetailModalProps {
  type: 'equipment'
  onUnequip?: () => void
}

export type ItemDetailModalProps =
  | InventoryItemDetailModalProps
  | ShopItemDetailModalProps
  | EquipmentItemDetailModalProps

function usesWideCompareLayout(props: ItemDetailModalProps): boolean {
  if (!props.item) return false
  if (props.type === 'shop') {
    const shopItem = props.item as ShopItem
    const isEquippableType = shopItem.type !== 'potion' && shopItem.type !== 'gem'
    return isEquippableType && props.equippedItem != null
  }
  if (props.type === 'inventory') {
    const gameItem = props.item as GameItem
    return props.source === 'inventory' && props.equippedItem != null && isEquippable(gameItem)
  }
  return false
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
        {/* 关闭按钮 */}
        <div className="absolute top-2 right-2 z-20">
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {props.type === 'inventory' && <InventoryItemDetail {...props} />}
        {props.type === 'shop' && <ShopItemDetail {...props} />}
        {props.type === 'equipment' && <EquipmentItemDetail {...props} />}
      </div>
    </div>
  )
}

function InventoryItemDetail(props: InventoryItemDetailModalProps) {
  const { item, source, equippedItem, onEquip, onUse, onMove, onSell, onClose } = props

  if (!item) return null

  const gameItem = item as GameItem

  // 判断是否有可对比的装备
  const hasEquippedItem = (): boolean => {
    if (!isEquippable(gameItem)) return false
    return equippedItem !== null && equippedItem !== undefined
  }

  // 获取操作按钮
  const getActions = (): ItemActionType[] => {
    const actions: ItemActionType[] = []

    // 来自背包时
    if (source === 'inventory') {
      // 药水 - 使用按钮
      if (isPotion(gameItem)) {
        actions.push('use')
      }
      // 可装备物品（除了药水和宝石）
      if (isEquippable(gameItem)) {
        actions.push('equip')
      }
      // 存入按钮
      actions.push('store')
      // 卖出按钮
      actions.push('sell')
    } else {
      // 来自仓库 - 取回按钮
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

  const hasEquipped = hasEquippedItem() && source === 'inventory' && equippedItem != null
  const actions = getActions()

  // 有对比时的布局 - 操作按钮在右边底部
  if (hasEquipped && equippedItem) {
    return (
      <FullComparePanel
        newItem={gameItem}
        equippedItem={equippedItem}
        actions={actions}
        onAction={handleAction}
      />
    )
  }

  // 无对比时的布局
  return (
    <div className="flex flex-col">
      <ItemDetailContent item={item} type="inventory" />
      <ItemActions actions={actions} onAction={handleAction} />
    </div>
  )
}

function ShopItemDetail(props: ShopItemDetailModalProps) {
  const {
    item,
    buyQuantity = 1,
    setBuyQuantity,
    totalBuyPrice,
    onBuy,
    disabledBuy,
    canAfford = true,
    levelEnough = true,
    inventoryFull = false,
    equippedItem,
  } = props

  if (!item) return null

  const shopItem = item as ShopItem

  // 计算是否有可对比的装备
  // 商店物品中，只有装备类型（不是药水和宝石）才能对比
  const isEquippableType = shopItem.type !== 'potion' && shopItem.type !== 'gem'
  const isPotion = shopItem.type === 'potion'
  const maxBuyQuantity = 9999

  const handleAddBuyQuantity = (amount: number) => {
    if (!setBuyQuantity) return
    setBuyQuantity(Math.min(maxBuyQuantity, buyQuantity + amount))
  }
  const hasEquipped = isEquippableType && equippedItem != null

  // 转换为 GameItem 用于对比计算
  // 使用 shopItem.id 作为 definition_id，用于显示物品图片
  const shopItemAsGameItem: GameItem & { shop_buy_price: number } = {
    id: 0,
    character_id: 0,
    definition_id: shopItem.id,
    definition: {
      id: shopItem.id,
      name: shopItem.name,
      type: shopItem.type,
      sub_type: shopItem.sub_type,
      base_stats: shopItem.base_stats,
      required_level: shopItem.required_level,
      buy_price: shopItem.buy_price,
      icon: shopItem.icon,
    },
    quality: shopItem.quality,
    stats: shopItem.base_stats,
    affixes: [],
    is_in_storage: false,
    quantity: 1,
    slot_index: null,
    sell_price: shopItem.sell_price,
    shop_buy_price: shopItem.buy_price,
  }

  const buyButtonLabel = inventoryFull
    ? shopItem.type === 'potion' || shopItem.type === 'gem'
      ? '背包已满'
      : '背包空间不足'
    : !canAfford
      ? '货币不足'
      : !levelEnough
        ? '等级不足'
        : '确认购买'

  const buyButton = (
    <button
      type="button"
      onClick={onBuy}
      disabled={disabledBuy}
      className="min-h-8 w-full rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
    >
      {buyButtonLabel}
    </button>
  )

  const buyFooter = (
    <>
      {setBuyQuantity && isPotion && (
        <div className="flex items-center justify-between px-3 pt-2">
          <span className="text-muted-foreground text-sm">数量: {buyQuantity}</span>
          <div className="flex items-center gap-1">
            {[1, 10, 100].map(qty => (
              <button
                key={qty}
                type="button"
                onClick={() => handleAddBuyQuantity(qty)}
                disabled={buyQuantity >= maxBuyQuantity}
                className="bg-muted text-muted-foreground hover:bg-muted/80 rounded px-3 py-1 text-xs transition-colors disabled:opacity-50"
              >
                +{qty}
              </button>
            ))}
          </div>
        </div>
      )}

      {isPotion && totalBuyPrice != null && totalBuyPrice > 0 && (
        <div className="flex items-center justify-between px-3 pt-1">
          <span className="text-foreground text-sm font-medium">总价:</span>
          <span className={canAfford ? '' : 'text-red-500'}>
            <CopperDisplay copper={totalBuyPrice} size="sm" />
          </span>
        </div>
      )}

      <div className="p-3">{buyButton}</div>
    </>
  )

  if (hasEquipped && equippedItem) {
    return (
      <FullComparePanel
        newItem={shopItemAsGameItem}
        equippedItem={equippedItem}
        isShop
        footer={buyButton}
      />
    )
  }

  return (
    <div className="flex flex-col">
      <ItemDetailContent item={item} type="shop" />
      {buyFooter}
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
