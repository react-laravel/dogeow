'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import type { CompendiumItem } from '../../types/compendium'
import { getItemIconFallback } from '../../utils/itemUtils'
import { getRpgItemImageUrl } from '../../utils/assetUrls'

/** 图鉴/掉落列表中的物品小图标：优先使用真实图片，失败时回退 emoji */
export const CompendiumItemIcon = memo(function CompendiumItemIcon({
  item,
  className,
}: {
  item: CompendiumItem
  className?: string
}) {
  const fallback = getItemIconFallback({ definition: item })
  const src = useMemo(() => getRpgItemImageUrl(item.icon, item.id), [item.icon, item.id])
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
