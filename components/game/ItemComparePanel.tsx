'use client'

import type { ReactNode } from 'react'
import type { GameItem, ShopItem, ItemQuality } from '@/app/game/rpg/types'
import { QUALITY_COLORS, STAT_NAMES } from '@/app/game/rpg/types'
import { ItemIcon } from './ItemIcon'
import { ItemActions, type ItemActionType } from './ItemActions'
import {
  formatItemStatValue,
  getCompareStatKeys,
  getItemDisplayName,
  getItemTotalStats,
  getShopItemIcon,
  getEquipmentSlot,
} from '@/app/game/rpg/utils/itemUtils'
import { CopperDisplay } from '@/app/game/rpg/components/shared/CopperDisplay'
import { ItemSocketIndicators } from '@/app/game/rpg/components/inventory/ItemSocketIndicators'
import { ItemUpgradeIndicator } from '@/app/game/rpg/components/inventory/ItemUpgradeIndicator'
import { isHigherValueThanEquipped } from '@/app/game/rpg/components/inventory/inventoryEquipmentUtils'

function CompareItemIconSlot({
  item,
  sizeClass = 'h-10 w-10',
  showUpgradeIndicator = false,
}: {
  item: GameItem
  sizeClass?: string
  showUpgradeIndicator?: boolean
}) {
  return (
    <div
      className={`relative flex shrink-0 ${sizeClass} items-center justify-center rounded border-2`}
      style={{ borderColor: QUALITY_COLORS[item.quality as ItemQuality] }}
    >
      <ItemIcon item={item} className="drop-shadow-sm" />
      {showUpgradeIndicator && <ItemUpgradeIndicator />}
      <ItemSocketIndicators item={item} className="absolute -top-1 -right-1 z-10" />
    </div>
  )
}

function CompareItemHeader({
  item,
  name,
  nameColor,
  sizeClass = 'h-10 w-10',
  showUpgradeIndicator = false,
}: {
  item?: GameItem
  name: string
  nameColor: string
  sizeClass?: string
  showUpgradeIndicator?: boolean
}) {
  const requiredLevel = item?.definition?.required_level

  return (
    <div className="mb-2 flex items-start gap-2">
      {item ? (
        <CompareItemIconSlot
          item={item}
          sizeClass={sizeClass}
          showUpgradeIndicator={showUpgradeIndicator}
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <span
          className="block text-sm leading-tight font-bold break-words"
          style={{ color: nameColor }}
        >
          {name}
        </span>
        {requiredLevel != null && requiredLevel > 0 ? (
          <p className="text-muted-foreground mt-0.5 text-xs">需求等级: {requiredLevel}</p>
        ) : null}
      </div>
    </div>
  )
}

function getComparedStatClass(value: number, compareValue: number): string {
  if (value > compareValue) return 'font-medium text-green-500'
  if (value < compareValue) return 'font-medium text-red-500'
  return 'font-medium'
}

function CompareStatList({
  statKeys,
  stats,
  compareStats,
}: {
  statKeys: string[]
  stats: Record<string, number>
  compareStats: Record<string, number>
}) {
  return (
    <div className="space-y-0.5">
      {statKeys.map(stat => {
        const value = stats[stat] || 0
        const compareValue = compareStats[stat] || 0

        return (
          <div key={stat} className="flex min-h-5 justify-between gap-1">
            <span className="text-muted-foreground shrink-0">{STAT_NAMES[stat] || stat}</span>
            {value !== 0 ? (
              <span className={getComparedStatClass(value, compareValue)}>
                {formatItemStatValue(value, stat)}
              </span>
            ) : (
              <span className="text-muted-foreground/40 font-medium">—</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** 左右对比属性：数值向内对齐，属性名居中，便于两列对齐 */
function PairedCompareStatList({
  statKeys,
  leftStats,
  rightStats,
}: {
  statKeys: string[]
  leftStats: Record<string, number>
  rightStats: Record<string, number>
}) {
  return (
    <div className="space-y-0.5">
      {statKeys.map(stat => {
        const leftValue = leftStats[stat] || 0
        const rightValue = rightStats[stat] || 0

        return (
          <div
            key={stat}
            className="grid min-h-5 grid-cols-[1fr_auto_1fr] items-center gap-x-1 text-xs"
          >
            <span
              className={`text-right tabular-nums ${
                leftValue !== 0
                  ? getComparedStatClass(leftValue, rightValue)
                  : 'text-muted-foreground/40 font-medium'
              }`}
            >
              {leftValue !== 0 ? formatItemStatValue(leftValue, stat) : '—'}
            </span>
            <span className="text-muted-foreground min-w-[3.25rem] shrink-0 px-1 text-right">
              {STAT_NAMES[stat] || stat}
            </span>
            <span
              className={`text-left tabular-nums ${
                rightValue !== 0
                  ? getComparedStatClass(rightValue, leftValue)
                  : 'text-muted-foreground/40 font-medium'
              }`}
            >
              {rightValue !== 0 ? formatItemStatValue(rightValue, stat) : '—'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

interface ItemComparePanelProps {
  newItem: GameItem | ShopItem
  equippedItem: GameItem
  isShop?: boolean
}

/** 装备对比面板 */
export function ItemComparePanel({ newItem, equippedItem, isShop = false }: ItemComparePanelProps) {
  const isShopItem = isShop

  // 计算新物品属性
  const newStats = isShopItem
    ? (newItem as ShopItem).base_stats || {}
    : getItemTotalStats(newItem as GameItem)

  // 计算已装备物品属性
  const equippedStats = getItemTotalStats(equippedItem)

  const compareStatKeys = getCompareStatKeys(newStats, equippedStats)

  // 过滤出有差异的属性（保持统一顺序，便于左右对齐）
  const diffStats = compareStatKeys.filter(stat => {
    const newValue = newStats[stat] || 0
    const equippedValue = equippedStats[stat] || 0
    return newValue !== equippedValue
  })

  const hasComparison = diffStats.length > 0

  if (!hasComparison) return null

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* 左边：当前装备 */}
      <div className="border-border rounded-lg border">
        <div
          className="p-2 text-center font-medium"
          style={{
            background: `linear-gradient(135deg, ${QUALITY_COLORS[equippedItem.quality as ItemQuality]}20 0%, ${QUALITY_COLORS[equippedItem.quality as ItemQuality]}10 100%)`,
            borderBottom: `1px solid ${QUALITY_COLORS[equippedItem.quality as ItemQuality]}30`,
          }}
        >
          当前装备
        </div>
        <div className="p-2">
          <CompareItemHeader
            item={equippedItem}
            name={getItemDisplayName(equippedItem)}
            nameColor={QUALITY_COLORS[equippedItem.quality as ItemQuality]}
            sizeClass="h-12 w-12"
          />
          <CompareStatList statKeys={diffStats} stats={equippedStats} compareStats={newStats} />
          {/* 当前装备价格 */}
          {equippedItem.sell_price != null && equippedItem.sell_price > 0 && (
            <div className="text-muted-foreground mt-1 flex justify-between text-xs">
              <span>卖出</span>
              <CopperDisplay
                copper={equippedItem.sell_price}
                size="sm"
                nowrap
                className="font-medium"
              />
            </div>
          )}
        </div>
      </div>

      {/* 右边：新物品 */}
      <div className="border-border flex-1 rounded-lg border">
        <div
          className="bg-green-500/10 p-2 text-center font-medium text-green-600 dark:text-green-400"
          style={{ borderBottom: '1px solid rgba(34,197,94,0.3)' }}
        >
          {isShopItem ? '商店物品' : '背包物品'}
        </div>
        <div className="p-2">
          {isShopItem ? (
            <div className="mb-2 flex items-start gap-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border-2 border-green-500">
                <span className="text-2xl">
                  {getShopItemIcon((newItem as ShopItem).type, (newItem as ShopItem).sub_type)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-sm leading-tight font-bold break-words text-green-600 dark:text-green-400">
                  {(newItem as ShopItem).name}
                </span>
                {(newItem as ShopItem).required_level > 0 ? (
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    需求等级: {(newItem as ShopItem).required_level}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <CompareItemHeader
              item={newItem as GameItem}
              name={getItemDisplayName(newItem as GameItem)}
              nameColor={QUALITY_COLORS[(newItem as GameItem).quality as ItemQuality]}
              sizeClass="h-12 w-12"
            />
          )}
          <CompareStatList statKeys={diffStats} stats={newStats} compareStats={equippedStats} />
        </div>
      </div>
    </div>
  )
}

/** 对比版本 - 用于Modal弹窗：只显示当前装备 */
export function EquipmentComparePanel({
  newItem,
  equippedItem,
}: {
  newItem: GameItem
  equippedItem: GameItem
}) {
  const newStats = getItemTotalStats(newItem)
  const equippedStats = getItemTotalStats(equippedItem)

  // 合并所有属性键
  const allStatKeys = Array.from(new Set([...Object.keys(newStats), ...Object.keys(equippedStats)]))

  // 过滤出有差异的属性
  const diffStats = allStatKeys.filter(stat => {
    const newValue = newStats[stat] || 0
    const equippedValue = equippedStats[stat] || 0
    return newValue !== equippedValue && (newValue !== 0 || equippedValue !== 0)
  })

  return (
    <div className="border-border bg-muted/20 flex w-[100px] shrink-0 flex-col border-r">
      {/* 顶部标题 */}
      <div
        className="p-2 text-center font-medium"
        style={{
          background: `linear-gradient(135deg, ${QUALITY_COLORS[equippedItem.quality as ItemQuality]}20 0%, ${QUALITY_COLORS[equippedItem.quality as ItemQuality]}10 100%)`,
          borderBottom: `1px solid ${QUALITY_COLORS[equippedItem.quality as ItemQuality]}30`,
        }}
      >
        当前装备
      </div>
      <div className="p-2">
        <CompareItemHeader
          item={equippedItem}
          name={getItemDisplayName(equippedItem)}
          nameColor={QUALITY_COLORS[equippedItem.quality as ItemQuality]}
          sizeClass="h-9 w-9"
        />
      </div>
      {/* 下方显示属性差异 */}
      <div className="border-border/50 bg-muted/10 flex-1 space-y-1 border-t px-2 py-2">
        {diffStats.length === 0 ? (
          <div className="text-muted-foreground text-center">属性相同</div>
        ) : (
          diffStats.map(stat => {
            const newValue = newStats[stat] || 0
            const equippedValue = equippedStats[stat] || 0
            const diff = newValue - equippedValue
            if (diff === 0) return null

            return (
              <div key={stat} className="flex items-center justify-between">
                <span className="text-muted-foreground">{STAT_NAMES[stat] || stat}</span>
                <span className="font-medium">
                  {diff > 0 ? (
                    <span className="text-green-500">+{diff}</span>
                  ) : (
                    <span className="text-red-500">{diff}</span>
                  )}
                </span>
              </div>
            )
          })
        )}
      </div>
      {/* 当前装备价格 */}
      {equippedItem.sell_price != null && equippedItem.sell_price > 0 && (
        <div className="text-muted-foreground border-border/50 bg-muted/10 flex justify-between border-t px-2 py-1.5 text-xs">
          <span>卖出</span>
          <CopperDisplay
            copper={equippedItem.sell_price}
            size="sm"
            nowrap
            className="font-medium"
          />
        </div>
      )}
    </div>
  )
}

/** 完整对比面板 - 用于Modal弹窗：左右装备+各自属性（差异以色标注） */
export function FullComparePanel({
  newItem,
  equippedItem,
  isShop = false,
  actions,
  onAction,
  footer,
}: {
  newItem: GameItem
  equippedItem: GameItem
  isShop?: boolean
  actions?: ItemActionType[]
  onAction?: (action: ItemActionType) => void
  /** @deprecated 宝石仅显示在图标角标，对比弹窗不再重复展示 */
  onUnsocketGem?: (socketIndex: number) => void
  /** 渲染在右侧物品栏底部（如商店购买按钮） */
  footer?: ReactNode
}) {
  const newStats = getItemTotalStats(newItem)
  const equippedStats = getItemTotalStats(equippedItem)
  const compareStatKeys = getCompareStatKeys(equippedStats, newStats)

  // 商店对比显示购入价（来自商店列表 buy_price）；背包对比显示卖出价
  const shopBuyPrice =
    (newItem as GameItem & { shop_buy_price?: number }).shop_buy_price ??
    newItem.definition?.buy_price ??
    0
  const newItemDisplayPrice = isShop
    ? shopBuyPrice
    : (newItem.sell_price ?? Math.floor((newItem.definition?.buy_price ?? 0) / 2))

  // 获取已装备物品的价格信息
  const equippedItemBuyPrice = equippedItem.definition?.buy_price ?? 0
  const equippedItemSellPrice =
    equippedItem.sell_price ?? Math.floor((equippedItem.definition?.buy_price ?? 0) / 2)

  const showUpgradeIndicator = isHigherValueThanEquipped(newItem, equippedItem)

  return (
    <div className="bg-card border-border w-full max-w-full overflow-hidden rounded-xl border shadow-2xl">
      <div className="flex items-start">
        <aside className="border-border w-[156px] shrink-0 border-r p-2">
          <CompareItemHeader
            item={equippedItem}
            name={getItemDisplayName(equippedItem)}
            nameColor={QUALITY_COLORS[equippedItem.quality as ItemQuality]}
          />
        </aside>
        <div className="min-w-0 flex-1 p-2">
          <CompareItemHeader
            item={newItem}
            name={getItemDisplayName(newItem)}
            nameColor={QUALITY_COLORS[newItem.quality as ItemQuality]}
            showUpgradeIndicator={showUpgradeIndicator}
          />
        </div>
      </div>

      <div className="border-border/50 border-t px-2 py-1.5">
        <PairedCompareStatList
          statKeys={compareStatKeys}
          leftStats={equippedStats}
          rightStats={newStats}
        />
      </div>

      <div className="border-border/50 flex items-start border-t">
        <aside className="border-border w-[156px] shrink-0 space-y-0.5 border-r p-2">
          <div className="text-muted-foreground flex justify-between gap-1 text-xs">
            <span className="shrink-0">卖出</span>
            <CopperDisplay
              copper={equippedItemSellPrice}
              size="sm"
              nowrap
              className="font-medium"
            />
          </div>
          {equippedItemBuyPrice > 0 && (
            <div className="flex justify-between gap-1 text-xs text-purple-600 dark:text-purple-400">
              <span className="shrink-0">买价</span>
              <span>{equippedItemBuyPrice}</span>
            </div>
          )}
        </aside>
        <div className="flex min-w-0 flex-1 flex-col p-2">
          <div className="text-muted-foreground flex justify-between gap-1 text-xs">
            <span className="shrink-0">{isShop ? '价格' : '卖出'}</span>
            <CopperDisplay copper={newItemDisplayPrice} size="sm" nowrap className="font-medium" />
          </div>
          {footer}
          {actions && actions.length > 0 && onAction && (
            <div className="mt-2">
              <ItemActions actions={actions} onAction={onAction} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
