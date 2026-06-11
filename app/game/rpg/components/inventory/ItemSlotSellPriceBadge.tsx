'use client'

import type { GameItem } from '../../types'
import { getItemSellTotalValue } from '../../utils/itemUtils'

export function ItemSlotSellPriceBadge({ item }: { item: GameItem }) {
  return (
    <div className="pointer-events-none absolute right-0 bottom-0 left-0 flex items-center justify-center">
      <span className="max-w-full truncate rounded bg-black/70 px-0.5 text-[8px] leading-none font-bold text-yellow-400 tabular-nums">
        {getItemSellTotalValue(item)}
      </span>
    </div>
  )
}
