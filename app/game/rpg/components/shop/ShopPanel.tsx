'use client'

import { memo, useState, useEffect, useMemo, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../stores/gameStore'
import { CopperDisplay } from '../shared/CopperDisplay'
import {
  ShopItem,
  QUALITY_COLORS,
  formatCopper,
  GameItem,
  ItemType,
  MERCENARY_DEFINITIONS,
  createMercenaryForCharacter,
  type MercenaryRole,
} from '../../types'
import { getEquipmentSlot } from '../../utils/itemUtils'
import { buildSlotArray } from '../inventory/inventoryUtils'
import { ItemUpgradeIndicator } from '../inventory/ItemUpgradeIndicator'
import { shouldShowShopUpgradeIndicator } from '../inventory/inventoryEquipmentUtils'
import { ItemDetailModal, ShopItemIcon } from '@/components/game'

/** 强制刷新费用：1 银 = 100 铜 */
const SHOP_REFRESH_COST_COPPER = 100

/** 每个非药水分类最多展示的物品数量（与后端配置一致） */
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

const MERCENARY_ROLES: MercenaryRole[] = ['guard', 'marksman', 'mystic']
const MERCENARY_ICONS: Record<MercenaryRole, string> = {
  guard: '🛡️',
  marksman: '🏹',
  mystic: '🔮',
}

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
  levelEnough,
  showUpgradeIndicator = false,
  onSelect,
}: {
  item: ShopItem
  isSelected: boolean
  isLoading: boolean
  canAfford: boolean
  levelEnough: boolean
  showUpgradeIndicator?: boolean
  onSelect: (item: ShopItem) => void
}) {
  const insufficientCurrency = levelEnough && !canAfford
  const borderColor =
    isSelected || insufficientCurrency
      ? undefined
      : !levelEnough
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
          : !levelEnough
            ? 'border-amber-400/70 bg-amber-500/10 ring-1 ring-amber-300/20 hover:bg-amber-500/15'
            : insufficientCurrency
              ? 'border-muted-foreground/20 bg-muted/20 opacity-45 grayscale saturate-0 hover:bg-muted/30'
              : 'bg-muted/40 hover:bg-muted/60'
      }`}
      style={borderColor ? { borderColor } : undefined}
      disabled={isLoading}
      title={`${item.name} - ${formatCopper(item.buy_price, 1)}${levelEnough ? '' : ` · 需求等级Lv.${item.required_level}`}`}
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
        {!levelEnough && (
          <span className="absolute top-0.5 right-0.5 rounded bg-amber-500/95 px-1 text-[8px] leading-3 font-bold text-black shadow-sm">
            Lv{item.required_level}
          </span>
        )}
      </span>
      <span className="border-border/40 bg-background/60 flex shrink-0 items-center justify-center border-t px-0.5 py-px">
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
      SHOP_TYPE_FILTERS.map(filter => {
        const items = shopItems
          .filter(item => filter.types.includes(item.type))
          .sort((a, b) => b.buy_price - a.buy_price)

        return {
          ...filter,
          items: filter.id === 'potion' ? items : items.slice(0, SHOP_ITEMS_PER_CATEGORY_MAX),
        }
      }).filter(group => group.items.length > 0),
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
                title={canAffordRefresh ? '强制刷新' : '需要1银币刷新'}
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
                        levelEnough={(character?.level ?? 0) >= item.required_level}
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
  const { character, mercenary, hireMercenary, isLoading } = useGameStore(
    useShallow(state => ({
      character: state.character,
      mercenary: state.mercenary,
      hireMercenary: state.hireMercenary,
      isLoading: state.isLoading,
    }))
  )

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 sm:px-4">
      {mercenary ? (
        <div className="border-border bg-card mb-3 rounded-lg border p-3">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl">
              {MERCENARY_ICONS[mercenary.role]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{mercenary.name}</div>
              <div className="text-muted-foreground text-xs">
                Lv.{mercenary.level} {MERCENARY_DEFINITIONS[mercenary.role].title}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <StatPill label="HP" value={mercenary.max_hp} />
                <StatPill label="攻击" value={mercenary.attack} />
                <StatPill label="防御" value={mercenary.defense} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        {MERCENARY_ROLES.map(role => {
          const definition = MERCENARY_DEFINITIONS[role]
          const preview = character ? createMercenaryForCharacter(character, role) : null
          const alreadyHired = mercenary?.role === role
          return (
            <button
              key={role}
              type="button"
              onClick={() => void hireMercenary(role)}
              disabled={isLoading || alreadyHired}
              className="border-border bg-card hover:bg-muted/40 disabled:bg-muted/20 rounded-lg border p-3 text-left transition-colors disabled:opacity-60"
            >
              <div className="flex items-start gap-3">
                <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl">
                  {MERCENARY_ICONS[role]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold">{definition.name}</div>
                    <span className="text-muted-foreground shrink-0 text-xs">免费</span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Lv.{preview?.level ?? character?.level ?? 1} {definition.title}
                  </div>
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                    {definition.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <StatPill label="HP" value={preview?.max_hp ?? '-'} />
                    <StatPill label="攻击" value={preview?.attack ?? '-'} />
                    <StatPill label="防御" value={preview?.defense ?? '-'} />
                  </div>
                  <div className="text-muted-foreground mt-2 text-xs">
                    {alreadyHired ? '已雇佣' : '点击雇佣'}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
