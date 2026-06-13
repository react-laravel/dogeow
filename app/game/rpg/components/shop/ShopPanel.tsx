'use client'

import { memo, useState, useEffect, useMemo, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../stores/gameStore'
import { CopperDisplay } from '../shared/CopperDisplay'
import { ShopItem, QUALITY_COLORS, formatCopper, GameItem, ItemType } from '../../types'
import { getEquipmentSlot } from '../../utils/itemUtils'
import { buildSlotArray } from '../inventory/inventoryUtils'
import { ItemUpgradeIndicator } from '../inventory/ItemUpgradeIndicator'
import { shouldShowShopUpgradeIndicator } from '../inventory/inventoryEquipmentUtils'
import { ItemDetailModal, ShopItemIcon } from '@/components/game'

/** 强制刷新费用：1 银 = 100 铜 */
const SHOP_REFRESH_COST_COPPER = 100

/** 每个分类最多展示的物品数量（与后端配置一致） */
const SHOP_ITEMS_PER_CATEGORY_MAX = 5

/** 商店分类行（顺序与左侧图标一致） */
const SHOP_TYPE_FILTERS: { id: string; label: string; name: string; types: ItemType[] }[] = [
  { id: 'weapon', label: '⚔️', name: '武器', types: ['weapon'] },
  { id: 'helmet', label: '🪖', name: '头盔', types: ['helmet'] },
  { id: 'armor', label: '🛡️', name: '护甲', types: ['armor'] },
  { id: 'gloves', label: '🧤', name: '手套', types: ['gloves'] },
  { id: 'boots', label: '👢', name: '靴子', types: ['boots'] },
  { id: 'belt', label: '🥋', name: '腰带', types: ['belt'] },
  { id: 'ring', label: '💍', name: '戒指', types: ['ring'] },
  { id: 'potion', label: '🧪', name: '药水', types: ['potion'] },
  { id: 'gem', label: '💎', name: '宝石', types: ['gem'] },
]

function ShopRefreshCountdown({ nextRefreshAt }: { nextRefreshAt: number | null }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))

  useEffect(() => {
    if (nextRefreshAt == null) return

    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [nextRefreshAt])

  if (nextRefreshAt == null) return null

  const countdown = Math.max(0, nextRefreshAt - now)
  const hours = Math.floor(countdown / 3600)
  const minutes = Math.floor((countdown % 3600) / 60)
  const seconds = countdown % 60
  const countdownLabel =
    countdown > 0
      ? hours > 0
        ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        : `${minutes}:${String(seconds).padStart(2, '0')}`
      : '刷新中'

  return (
    <span className="bg-muted/60 text-muted-foreground rounded-full px-2.5 py-0.5 text-[10px] sm:text-xs">
      {countdownLabel}
    </span>
  )
}

const ShopItemCell = memo(function ShopItemCell({
  item,
  isSelected,
  isLoading,
  canAfford,
  showUpgradeIndicator = false,
  onSelect,
}: {
  item: ShopItem
  isSelected: boolean
  isLoading: boolean
  canAfford: boolean
  showUpgradeIndicator?: boolean
  onSelect: (item: ShopItem) => void
}) {
  const borderColor = !canAfford
    ? undefined
    : isSelected
      ? undefined
      : item.quality
        ? QUALITY_COLORS[item.quality]
        : undefined

  return (
    <button
      onClick={() => onSelect(item)}
      className={`flex aspect-square w-full min-w-0 flex-col rounded-md border transition-all active:scale-95 ${
        isSelected
          ? 'border-green-500 bg-green-500/20 shadow-sm shadow-green-500/20 dark:border-green-400 dark:bg-green-400/20'
          : canAfford
            ? 'bg-muted/40 hover:bg-muted/60'
            : 'border-red-500/40 bg-red-950/20 opacity-55 grayscale hover:bg-red-950/30 hover:opacity-75'
      }`}
      style={borderColor ? { borderColor } : undefined}
      disabled={isLoading}
      title={`${item.name} - ${formatCopper(item.buy_price, 1)}${canAfford ? '' : '（货币不足）'}`}
    >
      <span className="relative flex min-h-0 flex-1 items-center justify-center p-0.5">
        <ShopItemIcon
          itemId={item.id}
          icon={item.icon}
          type={item.type}
          subType={item.sub_type}
          className="text-base sm:text-lg"
        />
        {showUpgradeIndicator && <ItemUpgradeIndicator />}
        {!canAfford && (
          <span className="absolute top-0.5 right-0.5 rounded bg-red-600/90 px-1 text-[8px] leading-3 font-bold text-white">
            不足
          </span>
        )}
      </span>
      <span
        className={`border-border/40 bg-background/60 flex shrink-0 items-center justify-center border-t px-0.5 py-px ${
          canAfford ? '' : 'text-red-400'
        }`}
      >
        <CopperDisplay copper={item.buy_price} size="xs" nowrap maxParts={1} />
      </span>
    </button>
  )
})

export function ShopPanel() {
  const [marketTab, setMarketTab] = useState<'shop' | 'mercenary'>('shop')

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="bg-muted mx-3 flex shrink-0 rounded-lg p-1 sm:mx-4">
        <button
          type="button"
          onClick={() => setMarketTab('shop')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            marketTab === 'shop'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🏪 商店
        </button>
        <button
          type="button"
          onClick={() => setMarketTab('mercenary')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            marketTab === 'mercenary'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🛡️ 雇佣兵
        </button>
      </div>
      {marketTab === 'shop' ? <ShopItemsPanel /> : <MercenaryMarketPanel />}
    </div>
  )
}

function ShopItemsPanel() {
  const {
    shopItems,
    character,
    buyItem,
    fetchShopItems,
    refreshShopItems,
    isLoading,
    shopNextRefreshAt,
    shopManualRefreshEnabled,
    equipment,
    inventory,
    inventorySize,
  } = useGameStore(
    useShallow(state => ({
      shopItems: state.shopItems,
      character: state.character,
      buyItem: state.buyItem,
      fetchShopItems: state.fetchShopItems,
      refreshShopItems: state.refreshShopItems,
      isLoading: state.isLoading,
      shopNextRefreshAt: state.shopNextRefreshAt,
      shopManualRefreshEnabled: state.shopManualRefreshEnabled,
      equipment: state.equipment,
      inventory: state.inventory,
      inventorySize: state.inventorySize,
    }))
  )
  const [selectedShopItem, setSelectedShopItem] = useState<ShopItem | null>(null)
  const [buyQuantity, setBuyQuantity] = useState(1)

  const canAffordRefresh = character != null && character.copper >= SHOP_REFRESH_COST_COPPER

  useEffect(() => {
    fetchShopItems()
  }, [fetchShopItems])

  const totalBuyPrice = selectedShopItem ? selectedShopItem.buy_price * buyQuantity : 0
  const canAfford = character && selectedShopItem && character.copper >= totalBuyPrice
  const levelEnough =
    character && selectedShopItem ? character.level >= selectedShopItem.required_level : false

  const usedInventorySlots = useMemo(() => {
    const slots = buildSlotArray(inventory, inventorySize)
    return slots.filter(slot => slot != null).length
  }, [inventory, inventorySize])

  const inventoryFull = usedInventorySlots >= inventorySize

  const handleBuy = useCallback(async () => {
    if (!selectedShopItem) return
    if (!canAfford || !levelEnough || buyQuantity < 1 || inventoryFull) return
    try {
      await buyItem(selectedShopItem.id, buyQuantity, selectedShopItem.listing_id)
      setSelectedShopItem(null)
      setBuyQuantity(1)
    } catch {
      // 错误已由 store 写入 error，保持弹窗打开便于重试
    }
  }, [selectedShopItem, canAfford, levelEnough, buyQuantity, inventoryFull, buyItem])

  const handleSelectShopItem = useCallback((item: ShopItem) => {
    setSelectedShopItem(item)
    setBuyQuantity(item.type === 'potion' ? 0 : 1)
  }, [])

  const itemsByCategory = useMemo(
    () =>
      SHOP_TYPE_FILTERS.map(filter => ({
        ...filter,
        items: shopItems
          .filter(item => filter.types.includes(item.type))
          .sort((a, b) => b.buy_price - a.buy_price)
          .slice(0, SHOP_ITEMS_PER_CATEGORY_MAX),
      })).filter(group => group.items.length > 0),
    [shopItems]
  )

  const displayedItemCount = useMemo(
    () => itemsByCategory.reduce((sum, group) => sum + group.items.length, 0),
    [itemsByCategory]
  )

  const selectedItemId = selectedShopItem?.id ?? null

  const getEquippedItem = (shopItem: ShopItem): GameItem | null => {
    const slot = getEquipmentSlot({ definition: { type: shopItem.type } } as GameItem)
    if (!slot) return null
    if (slot === 'ring') {
      return equipment.ring
    }
    return equipment[slot] ?? null
  }

  return (
    <>
      <div className="-ml-3 flex min-h-0 flex-1 flex-col overflow-hidden overscroll-none sm:-ml-4">
        <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 sm:px-4">
          <h4 className="text-foreground text-sm font-medium">
            商店物品
            <span className="text-muted-foreground ml-1.5 text-xs font-normal">
              {displayedItemCount}
            </span>
          </h4>
          <div className="flex shrink-0 items-center gap-1.5">
            <ShopRefreshCountdown nextRefreshAt={shopNextRefreshAt} />
            {shopManualRefreshEnabled && (
              <button
                type="button"
                onClick={() => refreshShopItems()}
                disabled={isLoading || !canAffordRefresh}
                className="bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] transition-colors disabled:opacity-50 sm:px-2.5 sm:text-xs"
                title={canAffordRefresh ? '强制刷新' : '货币不足，需要1银币'}
              >
                <RefreshCw className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                <span>刷新</span>
                <CopperDisplay copper={SHOP_REFRESH_COST_COPPER} size="xs" nowrap maxParts={1} />
              </button>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 pb-4 sm:px-4">
          {itemsByCategory.length > 0 ? (
            itemsByCategory.map(group => (
              <div
                key={group.id}
                className="border-border/40 flex shrink-0 items-stretch gap-1.5 border-b py-1.5 last:border-b-0"
              >
                <div
                  className="bg-muted/60 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
                  title={group.name}
                  aria-label={group.name}
                >
                  {group.label}
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5">
                  {group.items.map(item => (
                    <div key={item.listing_id ?? item.id} className="w-11 shrink-0 sm:w-12">
                      <ShopItemCell
                        item={item}
                        isSelected={selectedItemId === item.id}
                        isLoading={isLoading}
                        canAfford={(character?.copper ?? 0) >= item.buy_price}
                        showUpgradeIndicator={shouldShowShopUpgradeIndicator(
                          item,
                          getEquippedItem(item)
                        )}
                        onSelect={handleSelectShopItem}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
              暂无商店物品
            </p>
          )}
        </div>
      </div>

      <ItemDetailModal
        isOpen={selectedShopItem !== null}
        item={selectedShopItem}
        onClose={() => setSelectedShopItem(null)}
        type="shop"
        buyQuantity={buyQuantity}
        setBuyQuantity={setBuyQuantity}
        totalBuyPrice={totalBuyPrice}
        onBuy={handleBuy}
        disabledBuy={
          isLoading ||
          !character ||
          !canAfford ||
          !levelEnough ||
          inventoryFull ||
          (selectedShopItem?.type === 'potion' && buyQuantity < 1)
        }
        canAfford={!!canAfford}
        levelEnough={!!levelEnough}
        inventoryFull={inventoryFull}
        equippedItem={selectedShopItem ? getEquippedItem(selectedShopItem) : null}
      />
    </>
  )
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-muted/50 rounded-md px-2 py-1 text-xs">
      <span className="text-muted-foreground mr-1">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function MercenaryMarketPanel() {
  const { character, mercenaryTemplates, activeMercenary, hireMercenary, isLoading } = useGameStore(
    useShallow(state => ({
      character: state.character,
      mercenaryTemplates: state.mercenaryTemplates,
      activeMercenary: state.activeMercenary,
      hireMercenary: state.hireMercenary,
      isLoading: state.isLoading,
    }))
  )

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 sm:px-4">
      {activeMercenary ? (
        <div className="border-border bg-card mb-3 rounded-lg border p-3">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl">
              {activeMercenary.icon ?? '🛡️'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{activeMercenary.name}</div>
              <div className="text-muted-foreground text-xs">
                Lv.{activeMercenary.level} {activeMercenary.title ?? '雇佣兵'}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <StatPill
                  label="HP"
                  value={`${activeMercenary.current_hp}/${activeMercenary.stats.max_hp}`}
                />
                <StatPill label="攻击" value={activeMercenary.stats.attack} />
                <StatPill label="防御" value={activeMercenary.stats.defense} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        {mercenaryTemplates.map(template => {
          const canAfford = character != null && character.copper >= template.hire_cost
          const alreadyHired = activeMercenary?.template_id === template.id
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => void hireMercenary(template.id)}
              disabled={isLoading || alreadyHired || !canAfford}
              className="border-border bg-card hover:bg-muted/40 disabled:bg-muted/20 rounded-lg border p-3 text-left transition-colors disabled:opacity-60"
            >
              <div className="flex items-start gap-3">
                <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl">
                  {template.icon ?? '🛡️'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold">{template.name}</div>
                    <CopperDisplay copper={template.hire_cost} size="xs" nowrap maxParts={1} />
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Lv.{template.level} {template.title ?? '雇佣兵'}
                  </div>
                  {template.description && (
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                      {template.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <StatPill label="HP" value={template.base_stats.max_hp ?? '-'} />
                    <StatPill label="攻击" value={template.base_stats.attack ?? '-'} />
                    <StatPill label="防御" value={template.base_stats.defense ?? '-'} />
                  </div>
                  <div className="text-muted-foreground mt-2 text-xs">
                    {alreadyHired ? '已雇佣' : canAfford ? '点击雇佣' : '铜币不足'}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {mercenaryTemplates.length === 0 && (
        <p className="text-muted-foreground flex min-h-40 items-center justify-center text-sm">
          暂无可雇佣角色
        </p>
      )}
    </div>
  )
}
