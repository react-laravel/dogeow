'use client'

import Image from 'next/image'
import { memo, useCallback, useMemo, useState } from 'react'
import { getRpgMonsterImageUrl } from '../../utils/assetUrls'

export const MapCardMonsterAvatar = memo(function MapCardMonsterAvatar({
  icon,
  name,
}: {
  icon?: string | null
  name: string
}) {
  const src = useMemo(() => getRpgMonsterImageUrl(icon), [icon])
  const [failed, setFailed] = useState(false)
  const handleError = useCallback(() => setFailed(true), [])

  return (
    <span
      className="bg-muted/80 relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 text-[10px] font-medium"
      title={name}
    >
      {src && !failed ? (
        <Image
          src={src}
          alt=""
          fill
          unoptimized
          className="object-cover"
          sizes="24px"
          onError={handleError}
        />
      ) : (
        (name?.[0] ?? '?')
      )}
    </span>
  )
})
