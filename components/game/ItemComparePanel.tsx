'use client'

import type { ReactNode } from 'react'
import type { GameItem, ItemQuality } from '@/app/game/rpg/types'
import { QUALITY_COLORS, STAT_NAMES } from '@/app/game/rpg/types'
import { ItemIcon } from './ItemIcon'
import { ItemActions, type ItemActionType } from './ItemActions'
import {
  formatItemStatValue,
  getCompareStatKeys,
  getDisplayableItemStats,
  getItemDisplayName,
  getItemTotalStats,
  getEquipmentSlot,
} from '@/app/game/rpg/utils/itemUtils'
import { CopperDisplay } from '@/app/game/rpg/components/shared/CopperDisplay'
import { ItemSocketIndicators } from '@/app/game/rpg/components/inventory/ItemSocketIndicators'
import { ItemUpgradeIndicator } from '@/app/game/rpg/components/inventory/ItemUpgradeIndicator'
import { isHigherValueThanEquipped } from '@/app/game/rpg/components/inventory/inventoryEquipmentUtils'
import { useGameStore } from '@/app/game/rpg/stores/gameStore'
import { useShallow } from 'zustand/react/shallow'
import { getFullComparePanelWidthClass } from '@/app/game/rpg/utils/comparePanelUtils'

export {
  getFullComparePanelWidth,
  getFullComparePanelWidthClass,
} from '@/app/game/rpg/utils/comparePanelUtils'

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
  mirrored = false,
}: {
  statKeys: string[]
  stats: Record<string, number>
  compareStats: Record<string, number>
  mirrored?: boolean
}) {
  return (
    <div className="space-y-0.5 text-xs">
      {statKeys.map(stat => {
        const value = stats[stat] || 0
        const compareValue = compareStats[stat] || 0

        const statName = (
          <span className="text-muted-foreground shrink-0">{STAT_NAMES[stat] || stat}</span>
        )
        const statValue =
          value !== 0 ? (
            <span className={getComparedStatClass(value, compareValue)}>
              {formatItemStatValue(value, stat)}
            </span>
          ) : (
            <span className="text-muted-foreground/40 font-medium">—</span>
          )

        return (
          <div key={stat} className="flex min-h-[1.125rem] justify-between gap-1">
            {mirrored ? statValue : statName}
            {mirrored ? statName : statValue}
          </div>
        )
      })}
    </div>
  )
}

interface ItemComparePanelProps {
  newItem: GameItem
  equippedItem: GameItem
}

/** 装备对比面板 */
export function ItemComparePanel({ newItem, equippedItem }: ItemComparePanelProps) {
  const newStats = getDisplayableItemStats(getItemTotalStats(newItem))

  // 计算已装备物品属性
  const equippedStats = getDisplayableItemStats(getItemTotalStats(equippedItem))

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
          背包物品
        </div>
        <div className="p-2">
          <CompareItemHeader
            item={newItem}
            name={getItemDisplayName(newItem)}
            nameColor={QUALITY_COLORS[newItem.quality as ItemQuality]}
            sizeClass="h-12 w-12"
          />
          <CompareStatList
            statKeys={diffStats}
            stats={newStats}
            compareStats={equippedStats}
            mirrored
          />
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
      <div className="border-border/50 bg-muted/10 flex-1 space-y-1 border-t px-2 py-2 text-xs">
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
  actions,
  onAction,
  footer,
}: {
  newItem: GameItem
  equippedItem: GameItem
  actions?: ItemActionType[]
  onAction?: (action: ItemActionType) => void
  /** @deprecated 宝石仅显示在图标角标，对比弹窗不再重复展示 */
  onUnsocketGem?: (socketIndex: number) => void
  footer?: ReactNode
}) {
  const newStats = getItemTotalStats(newItem)
  const equippedStats = getItemTotalStats(equippedItem)
  const compareStatKeys = getCompareStatKeys(equippedStats, newStats)

  const newItemDisplayPrice =
    newItem.sell_price ?? Math.floor((newItem.definition?.buy_price ?? 0) / 2)

  // 获取已装备物品的价格信息
  const equippedItemBuyPrice = equippedItem.definition?.buy_price ?? 0
  const equippedItemSellPrice =
    equippedItem.sell_price ?? Math.floor((equippedItem.definition?.buy_price ?? 0) / 2)

  const showUpgradeIndicator = isHigherValueThanEquipped(newItem, equippedItem)

  const { compareEquippedCollapsed, toggleCompareEquippedCollapsed } = useGameStore(
    useShallow(state => ({
      compareEquippedCollapsed: state.compareEquippedCollapsed,
      toggleCompareEquippedCollapsed: state.toggleCompareEquippedCollapsed,
    }))
  )

  return (
    <div
      className={`relative flex max-w-full items-stretch ${getFullComparePanelWidthClass(compareEquippedCollapsed)}`}
    >
      {!compareEquippedCollapsed && (
        <aside className="bg-card border-border min-w-0 flex-[0_1_156px] rounded-l-lg border border-r-0 p-2 shadow-md">
          <CompareItemHeader
            item={equippedItem}
            name={getItemDisplayName(equippedItem)}
            nameColor={QUALITY_COLORS[equippedItem.quality as ItemQuality]}
          />
          <CompareStatList
            statKeys={compareStatKeys}
            stats={equippedStats}
            compareStats={newStats}
          />
          <div className="border-border/50 mt-2 space-y-0.5 border-t pt-1">
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
          </div>
        </aside>
      )}
      <div
        className={`bg-card border-border flex min-w-0 flex-col border p-2 shadow-md ${
          compareEquippedCollapsed ? 'w-[200px] rounded-lg' : 'flex-[1_1_200px] rounded-r-lg'
        }`}
      >
        <CompareItemHeader
          item={newItem}
          name={getItemDisplayName(newItem)}
          nameColor={QUALITY_COLORS[newItem.quality as ItemQuality]}
          showUpgradeIndicator={showUpgradeIndicator}
        />
        <CompareStatList
          statKeys={compareStatKeys}
          stats={newStats}
          compareStats={equippedStats}
          mirrored={!compareEquippedCollapsed}
        />
        <div className="border-border/50 mt-2 space-y-0.5 border-t pt-1">
          <div className="text-muted-foreground flex justify-between gap-1 text-xs">
            <span className="shrink-0">卖出</span>
            <CopperDisplay copper={newItemDisplayPrice} size="sm" nowrap className="font-medium" />
          </div>
        </div>
        <div className="-mx-2 -mb-2 mt-2">
          <ItemActions
            actions={actions ?? []}
            onAction={action => onAction?.(action)}
            compact
            leadingAction={
              <>
                <button
                  type="button"
                  onClick={toggleCompareEquippedCollapsed}
                  className="bg-muted hover:bg-muted/80 text-foreground border-border inline-flex min-w-12 items-center justify-center rounded border px-2.5 py-1.5 text-xs transition-colors"
                  aria-label={compareEquippedCollapsed ? '展开对比' : '收起对比'}
                  title={compareEquippedCollapsed ? '展开对比' : '收起对比'}
                >
                  {compareEquippedCollapsed ? '对比' : '收起'}
                </button>
                {footer ? <div className="min-w-0 flex-1">{footer}</div> : null}
              </>
            }
          />
        </div>
      </div>
    </div>
  )
}
