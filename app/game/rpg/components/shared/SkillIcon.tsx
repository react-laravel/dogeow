'use client'

import Image from 'next/image'
import { useState } from 'react'
import { getRpgSkillImageUrl } from '../../utils/assetUrls'

/** 技能图标：优先使用数据库里的 icon 文件名，缺失时回退为 effect_key，最后为文字占位。 */
export function SkillIcon({
  icon,
  effectKey,
  name,
}: {
  icon?: string | null
  effectKey?: string | null
  name: string
}) {
  // 优先使用 effect_key（映射到正确的图标文件名），其次用 icon，最后文字首字母
  const resolvedIcon = (() => {
    if (effectKey) {
      return effectKey.endsWith('.png') ? effectKey : `${effectKey}.png`
    }
    if (icon && /\.(png|jpe?g|webp|gif|svg)$/i.test(icon)) return icon
    return null
  })()
  const fallback = icon && icon.length <= 4 ? icon : name && name[0] ? name[0] : '?'
  const iconFile = resolvedIcon
  const [useImg, setUseImg] = useState(iconFile != null)
  const src = useImg && iconFile ? getRpgSkillImageUrl(iconFile) : ''
  return (
    <span className="bg-muted relative flex h-8 w-8 items-center justify-center overflow-hidden rounded text-base sm:h-9 sm:w-9">
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="36px"
          onError={() => setUseImg(false)}
        />
      ) : (
        fallback
      )}
    </span>
  )
}
