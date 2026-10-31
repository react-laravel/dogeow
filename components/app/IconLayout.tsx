'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import { Lock } from 'lucide-react'
import type { Tile } from '@/app/types'
import { tileSolidStyle, tileTintStyle } from '@/components/app/tileStyles'
import { useTranslation } from '@/hooks/useTranslation'
import { PERFORMANCE } from '@/lib/constants'
import { projectCoverAsset } from '@/lib/helpers/assets'
import type { ProjectCoverMode } from '@/stores/projectCoverStore'

interface IconLayoutProps {
  tiles: Tile[]
  projectCoverMode: ProjectCoverMode
  getTileStatus: (tile: Tile) => { needsLogin: boolean }
  handleTileClick: (tile: Tile) => void
}

interface IconTileProps {
  tile: Tile
  index: number
  projectCoverMode: ProjectCoverMode
  needsLogin: boolean
  onClick: () => void
}

/** 启动器风格的应用图标：圆角方形图标 + 下方名称，不再嵌套卡片 */
const IconTile = memo(({ tile, index, projectCoverMode, needsLogin, onClick }: IconTileProps) => {
  const { t } = useTranslation()
  const [imageError, setImageError] = useState(false)

  const tileName = useMemo(
    () => t(tile.nameKey, tile.nameCn || tile.nameKey),
    [t, tile.nameCn, tile.nameKey]
  )
  const coverImage = useMemo(
    () => (projectCoverMode === 'image' ? tile.cover || `${tile.name}.png` : null),
    [projectCoverMode, tile.cover, tile.name]
  )
  const showImage = !!coverImage && !imageError
  const handleImageError = useCallback(() => setImageError(true), [])

  // 图片模式加载失败时退回纯色，避免出现空白方块
  const shellStyle = useMemo(() => {
    if (showImage) return undefined
    return projectCoverMode === 'none' ? tileTintStyle(tile.color) : tileSolidStyle(tile.color)
  }, [projectCoverMode, showImage, tile.color])

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full min-w-0 flex-col items-center gap-2 rounded-2xl px-1 py-2 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      aria-label={tileName}
    >
      <div className="relative w-full max-w-[4.25rem] sm:max-w-[5rem]">
        <div
          className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[28%] transition-[transform,box-shadow] duration-200 ease-out group-hover:-translate-y-1 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 ${
            showImage
              ? 'bg-muted shadow-[0_8px_22px_-12px_rgb(0_0_0/0.45)] ring-1 ring-black/5 ring-inset dark:ring-white/10'
              : ''
          }`}
          style={shellStyle}
        >
          {showImage ? (
            <>
              <Image
                src={projectCoverAsset(coverImage)}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 640px) 68px, 80px"
                loading={index < 3 ? 'eager' : 'lazy'}
                fetchPriority={index < 3 ? 'high' : 'auto'}
                onError={handleImageError}
                quality={PERFORMANCE.IMAGE_QUALITY}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/12 via-transparent to-black/10" />
            </>
          ) : (
            <div
              className={`relative z-[1] flex size-7 items-center justify-center sm:size-8 [&>svg]:size-full [&>svg]:stroke-[1.75] ${
                projectCoverMode === 'none' ? '' : 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]'
              }`}
            >
              {tile.icon}
            </div>
          )}
        </div>

        {needsLogin && (
          <div className="bg-background text-muted-foreground ring-border absolute -top-1 -right-1 z-[2] flex size-5 items-center justify-center rounded-full shadow-sm ring-1">
            <Lock className="size-2.5" aria-hidden />
          </div>
        )}
      </div>

      <span className="text-foreground/85 group-hover:text-foreground line-clamp-2 px-0.5 text-xs leading-4 font-medium transition-colors sm:text-[13px]">
        {tileName}
      </span>
    </button>
  )
})

IconTile.displayName = 'IconTile'

export const IconLayout = memo(
  ({ tiles, projectCoverMode, getTileStatus, handleTileClick }: IconLayoutProps) => (
    <div className="grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] sm:gap-x-3 sm:gap-y-4">
      {tiles.map((tile, index) => {
        const tileStatus = getTileStatus(tile)

        return (
          <IconTile
            key={tile.name}
            tile={tile}
            index={index}
            projectCoverMode={projectCoverMode}
            needsLogin={tileStatus.needsLogin}
            onClick={() => handleTileClick(tile)}
          />
        )
      })}
    </div>
  )
)

IconLayout.displayName = 'IconLayout'
