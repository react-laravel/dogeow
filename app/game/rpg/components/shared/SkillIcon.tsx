'use client'

import Image from 'next/image'
import { useState } from 'react'
import { getRpgSkillImageUrl } from '../../utils/assetUrls'

/** 技能图标：仅使用数据库里的英文 icon 文件名，缺失时回退为文字占位。 */
export function SkillIcon({ icon, name }: { icon?: string | null; name: string }) {
  const fallback = icon && icon.length <= 4 ? icon : name && name[0] ? name[0] : '?'
  const iconFile = icon && /\.(png|jpe?g|webp|gif|svg)$/i.test(icon) ? icon : null
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
