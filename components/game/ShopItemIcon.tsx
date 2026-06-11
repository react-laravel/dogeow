'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import type { ItemType } from '@/app/game/rpg/types'
import { getShopItemIcon } from '@/app/game/rpg/utils/itemUtils'
import { getRpgItemImageUrl } from '@/app/game/rpg/utils/assetUrls'

interface ShopItemIconProps {
  itemId: number
  icon?: string | null
  type: ItemType
  subType?: string
  className?: string
}

/** 商店物品图标：优先使用图片，加载失败则用 emoji */
export const ShopItemIcon = memo(function ShopItemIcon({
  itemId,
  icon,
  type,
  subType,
  className,
}: ShopItemIconProps) {
  const fallback = getShopItemIcon(type, subType)
  const src = useMemo(() => getRpgItemImageUrl(icon, itemId), [icon, itemId])
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
      <Image src={src} alt="" fill className="object-contain" sizes="40px" onError={handleError} />
    </span>
  )
})
