'use client'

import Image from 'next/image'
import { memo, useCallback, useMemo, useState } from 'react'
import { getRpgSkillImageUrl } from '../../utils/assetUrls'

/** 技能图标：优先使用数据库里的 icon 文件名，缺失时回退为 effect_key，最后为文字占位。 */
export const SkillIcon = memo(function SkillIcon({
  icon,
  effectKey,
  name,
  size = 'md',
}: {
  icon?: string | null
  effectKey?: string | null
  name: string
  size?: 'sm' | 'md'
}) {
  const sizeClass = size === 'sm' ? 'h-5 w-5 text-xs' : 'h-8 w-8 text-base sm:h-9 sm:w-9'
  const imageSize = size === 'sm' ? '20px' : '36px'
  const iconFile = useMemo(() => {
    if (effectKey) {
      return effectKey.endsWith('.png') ? effectKey : `${effectKey}.png`
    }
    if (icon && /\.(png|jpe?g|webp|gif|svg)$/i.test(icon)) return icon
    return null
  }, [effectKey, icon])
  const fallback = icon && icon.length <= 4 ? icon : name && name[0] ? name[0] : '?'
  const src = useMemo(() => (iconFile ? getRpgSkillImageUrl(iconFile) : ''), [iconFile])
  const [failed, setFailed] = useState(false)
  const handleError = useCallback(() => setFailed(true), [])

  return (
    <span
      className={`bg-muted relative flex items-center justify-center overflow-hidden rounded ${sizeClass}`}
    >
      {src && !failed ? (
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes={imageSize}
          onError={handleError}
        />
      ) : (
        fallback
      )}
    </span>
  )
})
