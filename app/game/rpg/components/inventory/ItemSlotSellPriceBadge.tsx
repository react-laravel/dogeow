'use client'

import type { GameItem } from '../../types'
import { getItemSellTotalValue } from '../../utils/itemUtils'

export function ItemSlotSellPriceBadge({ item }: { item: GameItem }) {
  return (
    <div className="pointer-events-none absolute right-0 bottom-0 left-0 flex items-center justify-center">
      <span className="rounded bg-black/70 px-1 text-[9px] font-medium text-yellow-400">
        {getItemSellTotalValue(item)}
      </span>
    </div>
  )
}
