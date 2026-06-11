'use client'

import Image from 'next/image'
import { memo, useCallback, useMemo, useState } from 'react'
import { getRpgMonsterImageUrl } from '../../utils/assetUrls'

export const MapCardMonsterAvatar = memo(function MapCardMonsterAvatar({
  icon,
  name,
  large = false,
}: {
  icon?: string | null
  name: string
  large?: boolean
}) {
  const src = useMemo(() => getRpgMonsterImageUrl(icon), [icon])
  const [failed, setFailed] = useState(false)
  const handleError = useCallback(() => setFailed(true), [])
  const dimension = large ? 48 : 32

  if (src && !failed) {
    return (
      <span
        className={`relative flex shrink-0 items-center justify-center ${
          large ? 'h-12 w-12' : 'h-8 w-8'
        }`}
        title={name}
      >
        <Image
          src={src}
          alt=""
          width={dimension}
          height={dimension}
          className="h-full w-full object-contain"
          sizes={`${dimension}px`}
          onError={handleError}
        />
      </span>
    )
  }

  return (
    <span
      className={`bg-muted/50 relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 font-medium ${
        large ? 'h-12 w-12 text-xs' : 'h-8 w-8 text-[10px]'
      }`}
      title={name}
    >
      {name?.[0] ?? '?'}
    </span>
  )
})
