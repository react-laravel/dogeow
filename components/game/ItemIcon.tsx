'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import type { GameItem } from '@/app/game/rpg/types'
import { getItemIconFallback } from '@/app/game/rpg/utils/itemUtils'
import { getRpgItemImageUrl } from '@/app/game/rpg/utils/assetUrls'

/** 物品小图标：优先使用图片，加载失败则用 emoji */
export const ItemIcon = memo(function ItemIcon({
  item,
  className,
}: {
  item: GameItem
  className?: string
}) {
  const definitionId = item.definition?.id
  const fallback = getItemIconFallback(item)
  const src = useMemo(
    () => getRpgItemImageUrl(item.definition?.icon, definitionId),
    [item.definition?.icon, definitionId]
  )
  const [failed, setFailed] = useState(false)
  const handleError = useCallback(() => setFailed(true), [])

  if (!src || failed) {
    return (
      <span
        className={`inline-flex h-full w-full items-center justify-center drop-shadow-sm ${className ?? ''}`}
      >
        {fallback}
      </span>
    )
  }

  return (
    <span
      className={`relative inline-flex h-full w-full items-center justify-center ${className ?? ''}`}
    >
      <Image src={src} alt="" fill className="object-contain" sizes="48px" onError={handleError} />
    </span>
  )
})
