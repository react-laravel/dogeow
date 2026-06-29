'use client'

import type { GameItem, ItemQuality } from '@/app/game/rpg/types'
import { QUALITY_COLORS, QUALITY_NAMES, STAT_NAMES } from '@/app/game/rpg/types'
import { ItemTipIcon } from './ItemTipIcon'
import {
  formatItemStatValue,
  formatAffixLine,
  getDisplayableItemStats,
  getItemDisplayName,
  getItemTotalStats,
  ITEM_TYPE_NAMES,
} from '@/app/game/rpg/utils/itemUtils'
import { CopperDisplay } from '@/app/game/rpg/components/shared/CopperDisplay'

interface ItemDetailContentProps {
  item: GameItem
  type: 'inventory' | 'equipment'
}

export function ItemDetailContent({ item, type }: ItemDetailContentProps) {
  const quality = item.quality
  const stats = getDisplayableItemStats(getItemTotalStats(item))
  const affixLines =
    type === 'inventory'
      ? (item.affixes ?? [])
          .map(affix => formatAffixLine(affix))
          .filter((line): line is string => line != null)
      : []
  const displayName = getItemDisplayName(item)
  const typeName = ITEM_TYPE_NAMES[item.definition?.type ?? '']
  const subType = item.definition?.sub_type
  const requiredLevel = item.definition?.required_level
  const price = item.sell_price
  const buyPrice = item.definition?.buy_price
  const hasStatBlock =
    Object.keys(stats).length > 0 ||
    affixLines.length > 0 ||
    (buyPrice != null && buyPrice > 0) ||
    (price != null && price > 0)

  return (
    <div
      className="relative flex gap-3 p-3"
      style={{
        background: `linear-gradient(135deg, ${QUALITY_COLORS[quality as ItemQuality]}20 0%, ${QUALITY_COLORS[quality as ItemQuality]}10 100%)`,
        borderBottom: `1px solid ${QUALITY_COLORS[quality as ItemQuality]}30`,
      }}
    >
      <ItemTipIcon item={item} className="shrink-0 drop-shadow-lg" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h5
              className="min-w-0 text-sm leading-tight font-bold break-words sm:text-base"
              style={{ color: QUALITY_COLORS[quality as ItemQuality] }}
            >
              {displayName}
            </h5>
            <span className="text-xs" style={{ color: QUALITY_COLORS[quality as ItemQuality] }}>
              {QUALITY_NAMES[quality as ItemQuality]}
            </span>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {typeName}
              {subType ? ` · ${subType}` : ''}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">需求等级: {requiredLevel ?? '—'}</p>
          </div>
        </div>

        {hasStatBlock && (
          <div className="mt-1 space-y-0.5 text-xs">
            {Object.entries(stats).map(([stat, value]) => (
              <p key={stat} className="text-green-600 dark:text-green-400">
                +{formatItemStatValue(Number(value), stat)} {STAT_NAMES[stat] || stat}
              </p>
            ))}

            {affixLines.map((line, i) => (
              <p key={i} className="text-blue-600 dark:text-blue-400">
                {line}
              </p>
            ))}

            {buyPrice != null && buyPrice > 0 && (
              <p className="text-purple-600 dark:text-purple-400">
                售价: <CopperDisplay copper={buyPrice} size="sm" nowrap className="font-medium" />
              </p>
            )}

            {price != null && price > 0 && (
              <p className="text-muted-foreground">
                卖出: <CopperDisplay copper={price} size="sm" nowrap className="font-medium" />
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
