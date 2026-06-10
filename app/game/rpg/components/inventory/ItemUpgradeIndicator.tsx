'use client'

import { ArrowUp } from 'lucide-react'

export function ItemUpgradeIndicator() {
  return (
    <span
      className="absolute top-0 left-0 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/70 text-green-400"
      aria-label="价值高于已装备"
    >
      <ArrowUp className="h-2.5 w-2.5 stroke-[3]" />
    </span>
  )
}
