'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import { Lock } from 'lucide-react'
import type { Tile } from '@/app/types'
import { useTranslation } from '@/hooks/useTranslation'
import { PERFORMANCE } from '@/lib/constants'
import { imageAsset } from '@/lib/helpers/assets'
import type { ProjectCoverMode } from '@/stores/projectCoverStore'

interface IconLayoutProps {
  tiles: Tile[]
  projectCoverMode: ProjectCoverMode
  getTileStatus: (tile: Tile) => { needsLogin: boolean }
  handleTileClick: (tile: Tile) => void
}

interface IconTileProps {
  tile: Tile
  projectCoverMode: ProjectCoverMode
  needsLogin: boolean
  onClick: () => void
}

const IconTile = memo(({ tile, projectCoverMode, needsLogin, onClick }: IconTileProps) => {
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
  const showImagePattern = !!coverImage && !imageError
  const handleImageError = useCallback(() => setImageError(true), [])

  const shellClassName = useMemo(() => {
    const baseClassName =
      'relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-muted/45 transition-transform duration-200 group-hover:scale-[1.02] group-active:scale-[0.98]'

    if (projectCoverMode === 'image') {
      return baseClassName
    }

    if (projectCoverMode === 'color') {
      return baseClassName
    }

    return `${baseClassName} border border-border/60`
  }, [projectCoverMode])

  return (
    <button
      type="button"
      onClick={onClick}
      className="app-surface app-surface-interactive group flex min-w-0 flex-col gap-2 p-2 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      aria-label={needsLogin ? `打开 ${tileName}（需登录）` : `打开 ${tileName}`}
    >
      <div
        className={shellClassName}
        style={projectCoverMode === 'color' ? { backgroundColor: tile.color } : undefined}
      >
        {showImagePattern && (
          <>
            <Image
              src={imageAsset(`/images/projects/${coverImage}`)}
              alt={`${tileName} icon pattern`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 20vw, 120px"
              priority
              onError={handleImageError}
              quality={PERFORMANCE.IMAGE_QUALITY}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-white/8" />
          </>
        )}

        {projectCoverMode !== 'image' && (
          <div
            className={`relative z-[1] flex h-8 w-8 items-center justify-center sm:h-10 sm:w-10 ${
              projectCoverMode === 'none'
                ? 'text-foreground dark:text-white'
                : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.28)]'
            }`}
          >
            {tile.icon}
          </div>
        )}

        {needsLogin && (
          <div className="absolute top-2 right-2 z-[2] flex h-5 w-5 items-center justify-center rounded-full bg-black/55">
            <Lock className="h-3 w-3 text-white" />
          </div>
        )}
      </div>

      <span className="line-clamp-2 flex min-h-9 items-center justify-center px-1 text-xs font-medium leading-4 text-foreground sm:text-sm">
        {tileName}
      </span>
    </button>
  )
})

IconTile.displayName = 'IconTile'

export const IconLayout = memo(
  ({ tiles, projectCoverMode, getTileStatus, handleTileClick }: IconLayoutProps) => (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {tiles.map(tile => {
        const tileStatus = getTileStatus(tile)

        return (
          <IconTile
            key={tile.name}
            tile={tile}
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
