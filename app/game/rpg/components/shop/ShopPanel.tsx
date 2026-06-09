'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { RefreshCw } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import { CopperDisplay } from '../shared/CopperDisplay'
import { ShopItem, QUALITY_COLORS, formatCopper, GameItem, ItemType } from '../../types'
import { getRpgItemImageUrl } from '../../utils/assetUrls'
import { getShopItemIcon, getEquipmentSlot } from '../../utils/itemUtils'
import { ItemDetailModal } from '@/components/game'

/** 商店物品图标：优先使用图片，加载失败则用 emoji */
function ShopItemIcon({ item, className }: { item: ShopItem; className?: string }) {
  const definitionId = item.id
  const fallback = getShopItemIcon(item.type, item.sub_type)
  const [useImg, setUseImg] = useState(true)
  const src = getRpgItemImageUrl(item.icon, definitionId)

  return (
    <span
      className={`relative inline-flex h-full w-full items-center justify-center ${className ?? ''}`}
    >
      {useImg ? (
        <Image
          src={src}
          alt=""
          fill
          className="object-contain"
          sizes="48px"
          onError={() => setUseImg(false)}
        />
      ) : (
        <span className="drop-shadow-sm">{fallback}</span>
      )}
    </span>
  )
}

/** 强制刷新费用：1 银 = 100 铜 */
const SHOP_REFRESH_COST_COPPER = 100

/** 商店物品类型筛选选项 */
const SHOP_TYPE_FILTERS: { id: string; label: string; types: ItemType[] }[] = [
  { id: 'weapon', label: '⚔️', types: ['weapon'] },
  { id: 'helmet', label: '🪖', types: ['helmet'] },
  { id: 'armor', label: '🛡️', types: ['armor'] },
  { id: 'gloves', label: '🧤', types: ['gloves'] },
  { id: 'boots', label: '👢', types: ['boots'] },
  { id: 'belt', label: '🥋', types: ['belt'] },
  { id: 'ring', label: '💍', types: ['ring'] },
  { id: 'potion', label: '🧪', types: ['potion'] },
  { id: 'gem', label: '💎', types: ['gem'] },
]

export function ShopPanel() {
  const {
    shopItems,
    character,
    buyItem,
    fetchShopItems,
    refreshShopItems,
    isLoading,
    shopNextRefreshAt,
    equipment,
  } = useGameStore()
  const [selectedShopItem, setSelectedShopItem] = useState<ShopItem | null>(null)
  const [buyQuantity, setBuyQuantity] = useState(1)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  const canAffordRefresh = character != null && character.copper >= SHOP_REFRESH_COST_COPPER

  // 倒计时更新
  useEffect(() => {
    if (shopNextRefreshAt == null) {
      return
    }

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000)
      const remaining = shopNextRefreshAt - now
      if (remaining > 0) {
        setCountdown(remaining)
      } else {
        setCountdown(0)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [shopNextRefreshAt])

  useEffect(() => {
    fetchShopItems()
  }, [fetchShopItems])

  const totalBuyPrice = selectedShopItem ? selectedShopItem.buy_price * buyQuantity : 0
  const canAfford = character && selectedShopItem && character.copper >= totalBuyPrice
  const levelEnough =
    character && selectedShopItem ? character.level >= selectedShopItem.required_level : false

  const handleBuy = useCallback(async () => {
    if (!selectedShopItem) return
    if (!canAfford || !levelEnough) return
    await buyItem(selectedShopItem.id, buyQuantity)
    setSelectedShopItem(null)
    setBuyQuantity(1)
  }, [selectedShopItem, canAfford, levelEnough, buyItem, buyQuantity])

  const handleSelectShopItem = (item: ShopItem) => {
    setSelectedShopItem(item)
    setBuyQuantity(1)
  }

  // 根据类型筛选物品，并按价格倒序排列
  const filteredItems = useMemo(() => {
    if (!typeFilter) {
      return [...shopItems].sort((a, b) => b.buy_price - a.buy_price)
    }
    const filter = SHOP_TYPE_FILTERS.find(f => f.id === typeFilter)
    const items = filter ? shopItems.filter(item => filter.types.includes(item.type)) : shopItems
    return [...items].sort((a, b) => b.buy_price - a.buy_price)
  }, [shopItems, typeFilter])

  // 获取商店物品对应的已装备物品
  const getEquippedItem = (shopItem: ShopItem): GameItem | null => {
    const slot = getEquipmentSlot({ definition: { type: shopItem.type } } as GameItem)
    if (!slot) return null
    // 戒指特殊处理：返回 ring
    if (slot === 'ring') {
      return equipment.ring
    }
    return equipment[slot] ?? null
  }

  return (
    <>
      <div className="-ml-3 flex h-full min-h-0 flex-col overflow-hidden sm:-ml-4">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* 左侧分类栏 - 贴屏幕左边缘 */}
          <aside className="flex w-[3.75rem] shrink-0 flex-col justify-center gap-2.5 py-3 sm:w-16 sm:gap-3">
            {SHOP_TYPE_FILTERS.map(filter => {
              const isActive = typeFilter === filter.id
              return (
                <button
                  key={filter.id}
                  onClick={() => setTypeFilter(isActive ? null : filter.id)}
                  className={`flex h-11 w-full shrink-0 items-center justify-center rounded-r-xl text-[1.4rem] transition-colors sm:h-12 sm:text-2xl ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted active:bg-muted/80'
                  }`}
                  title={filter.id}
                >
                  {filter.label}
                </button>
              )
            })}
          </aside>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 sm:px-4">
              <h4 className="text-foreground text-sm font-medium">
                商店物品
                <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                  {filteredItems.length}/{shopItems.length}
                </span>
              </h4>
              {countdown != null && (
                <span className="bg-muted/60 text-muted-foreground rounded-full px-2.5 py-0.5 text-[10px] sm:text-xs">
                  {countdown > 0
                    ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`
                    : '刷新中'}
                </span>
              )}
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 sm:px-3">
              {filteredItems.length > 0 ? (
                <div className="grid h-full w-full max-h-full max-w-lg grid-cols-5 grid-rows-4 gap-1.5 sm:gap-2">
                  {filteredItems.map(item => {
                    const isSelected = selectedShopItem?.id === item.id
                    const borderColor = isSelected
                      ? undefined
                      : item.quality
                        ? QUALITY_COLORS[item.quality]
                        : undefined

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectShopItem(item)}
                        className={`flex h-full min-h-0 w-full min-w-0 flex-col rounded-md border-2 transition-all active:scale-95 ${
                          isSelected
                            ? 'border-green-500 bg-green-500/20 shadow-md shadow-green-500/30 dark:border-green-400 dark:bg-green-400/20'
                            : 'bg-muted/40 hover:bg-muted/60'
                        }`}
                        style={borderColor ? { borderColor } : undefined}
                        disabled={isLoading}
                        title={`${item.name} - ${formatCopper(item.buy_price, 1)}`}
                      >
                        <span className="flex min-h-0 flex-1 items-center justify-center p-1">
                          <ShopItemIcon item={item} />
                        </span>
                        <span className="border-border/40 bg-background/60 flex shrink-0 items-center justify-center border-t px-1 py-0.5">
                          <CopperDisplay copper={item.buy_price} size="xs" nowrap maxParts={1} />
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">暂无该分类物品</p>
              )}
            </div>

            <div className="flex shrink-0 justify-center px-3 py-2 sm:px-4">
              <button
                type="button"
                onClick={() => refreshShopItems()}
                disabled={isLoading || !canAffordRefresh}
                className="bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 rounded-full px-4 py-2 text-xs transition-colors disabled:opacity-50"
                title={canAffordRefresh ? '强制刷新' : '货币不足，需要1银币'}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>刷新商店</span>
                <CopperDisplay copper={SHOP_REFRESH_COST_COPPER} size="xs" nowrap maxParts={1} />
              </button>
            </div>
          </div>
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
        disabledBuy={isLoading || !character || !canAfford || !levelEnough}
        canAfford={!!canAfford}
        levelEnough={!!levelEnough}
        equippedItem={selectedShopItem ? getEquippedItem(selectedShopItem) : null}
      />
    </>
  )
}
