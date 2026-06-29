'use client'

import type { ReactNode } from 'react'
import { CopperDisplay } from '../shared/CopperDisplay'
import { GameItem, QUALITY_COLORS, QUALITY_NAMES, STAT_NAMES } from '../../types'
import {
  formatItemStatValue,
  formatAffixLine,
  getDisplayableItemStats,
  getItemDisplayName,
  getItemTotalStats,
} from '../../utils/itemUtils'
import { ItemTipIcon } from '@/components/game/ItemTipIcon'
import { ItemSocketIndicators } from './ItemSocketIndicators'

interface InventoryItemDetailCardProps {
  item: GameItem
  onClose: () => void
  footer?: ReactNode
  isLoading?: boolean
  onUnsocketGem?: (socketIndex: number) => void
  showBuyPrice?: boolean
}

interface EquipmentDetailBodyProps {
  item: GameItem
  isLoading?: boolean
  onUnsocketGem?: (socketIndex: number) => void
  showBuyPrice?: boolean
}

export function EquipmentGemSockets({
  item,
  isLoading = false,
  onUnsocketGem,
}: Pick<EquipmentDetailBodyProps, 'item' | 'isLoading' | 'onUnsocketGem'>) {
  if ((item.gems?.length ?? 0) === 0 && (item.sockets == null || item.sockets <= 0)) {
    return null
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {item.gems?.map(gem => (
        <button
          key={gem.id}
          onClick={() => onUnsocketGem?.(gem.socket_index)}
          disabled={isLoading || !onUnsocketGem}
          className="text-cyan-600 hover:underline disabled:opacity-50 dark:text-cyan-400"
        >
          💎 {gem.gemDefinition?.name || '宝石'}
        </button>
      ))}
      <ItemSocketIndicators item={item} size="md" variant="detail" />
    </div>
  )
}

export function EquipmentDetailBody({
  item,
  isLoading = false,
  onUnsocketGem,
  showBuyPrice = false,
}: EquipmentDetailBodyProps) {
  const displayStats = getDisplayableItemStats(getItemTotalStats(item))
  const affixLines = (item.affixes ?? [])
    .map(affix => formatAffixLine(affix))
    .filter((line): line is string => line != null)
  const hasBuyPrice =
    showBuyPrice && item.definition?.buy_price != null && item.definition.buy_price > 0
  const hasStatBlock = Object.keys(displayStats).length > 0 || affixLines.length > 0 || hasBuyPrice

  return (
    <>
      <EquipmentGemSockets item={item} isLoading={isLoading} onUnsocketGem={onUnsocketGem} />

      {hasStatBlock && (
        <div className="mt-1 space-y-0.5 text-xs">
          {Object.entries(displayStats).map(([stat, value]) => (
            <p key={stat} className="text-green-600 dark:text-green-400">
              +{formatItemStatValue(Number(value), stat)} {STAT_NAMES[stat] || stat}
            </p>
          ))}
          {item.definition?.type !== 'gem' &&
            affixLines.map((line, idx) => (
              <p key={idx} className="text-blue-600 dark:text-blue-400">
                {line}
              </p>
            ))}
          {hasBuyPrice && (
            <p className="text-purple-600 dark:text-purple-400">
              售价:{' '}
              <CopperDisplay
                copper={item.definition!.buy_price!}
                size="sm"
                nowrap
                className="font-medium"
              />
            </p>
          )}
        </div>
      )}
      <p
        className={`text-muted-foreground flex items-center gap-1 text-xs ${hasStatBlock ? 'mt-1' : ''}`}
      >
        卖出:{' '}
        <CopperDisplay
          copper={item.sell_price ?? Math.floor((item.definition?.buy_price ?? 0) / 2)}
          size="sm"
          nowrap
          className="font-medium"
        />
      </p>
    </>
  )
}

export function InventoryItemDetailCard({
  item,
  onClose,
  footer,
  isLoading = false,
  onUnsocketGem,
  showBuyPrice = false,
}: InventoryItemDetailCardProps) {
  return (
    <div className="flex flex-col">
      <div
        className="relative flex gap-3 p-3"
        style={{
          background: `linear-gradient(135deg, ${QUALITY_COLORS[item.quality]}20 0%, ${QUALITY_COLORS[item.quality]}10 100%)`,
          borderBottom: `1px solid ${QUALITY_COLORS[item.quality]}30`,
        }}
      >
        <ItemTipIcon item={item} className="shrink-0 drop-shadow-lg" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h5
                className="min-w-0 text-sm leading-tight font-bold break-words sm:text-base"
                style={{ color: QUALITY_COLORS[item.quality] }}
              >
                {getItemDisplayName(item)}
              </h5>
              <span className="text-xs" style={{ color: QUALITY_COLORS[item.quality] }}>
                {QUALITY_NAMES[item.quality]}
              </span>
              <p className="text-muted-foreground mt-0.5 text-xs">
                需求等级: {item.definition?.required_level ?? '—'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground ml-1 shrink-0 p-1"
            >
              ✕
            </button>
          </div>

          <EquipmentDetailBody
            item={item}
            isLoading={isLoading}
            onUnsocketGem={onUnsocketGem}
            showBuyPrice={showBuyPrice}
          />
        </div>
      </div>

      {footer ? (
        <div className="border-border bg-muted/30 flex flex-wrap gap-1.5 border-t p-2.5">
          {footer}
        </div>
      ) : null}
    </div>
  )
}
