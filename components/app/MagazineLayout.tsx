'use client'

import { memo, useMemo, useState, useCallback } from 'react'
import Image from 'next/image'
import { ChevronRight, Lock } from 'lucide-react'
import type { Tile } from '@/app/types'
import { tileTintStyle } from '@/components/app/tileStyles'
import { useTranslation } from '@/hooks/useTranslation'
import { PERFORMANCE } from '@/lib/constants'
import { projectCoverAsset } from '@/lib/helpers/assets'
import type { ProjectCoverMode } from '@/stores/projectCoverStore'

interface MagazineTileCardProps {
  tile: Tile
  projectCoverMode: ProjectCoverMode
  needsLogin: boolean
  onClick: () => void
}

/** 杂志布局 - 普通卡片（列表样式，带图标和箭头） */
const ListCard = memo(({ tile, projectCoverMode, needsLogin, onClick }: MagazineTileCardProps) => {
  const { t } = useTranslation()
  const [imageError, setImageError] = useState(false)

  const tileName = useMemo(
    () => t(tile.nameKey, tile.nameCn || tile.nameKey),
    [t, tile.nameKey, tile.nameCn]
  )
  const coverImage = useMemo(
    () => (projectCoverMode === 'image' ? tile.cover || `${tile.name}.png` : null),
    [projectCoverMode, tile.cover, tile.name]
  )
  const handleImageError = useCallback(() => setImageError(true), [])
  const showPreview = projectCoverMode !== 'none'
  const showImagePreview = !!coverImage && !imageError
  const contentTextClassName = showPreview ? 'text-white' : 'text-foreground'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3.5 overflow-hidden rounded-2xl border p-3.5 text-left transition-[transform,box-shadow,border-color,background-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] motion-reduce:transition-none sm:p-4 ${
        showPreview
          ? `${showImagePreview ? 'min-h-24 sm:min-h-28' : ''} border-white/15 shadow-[0_14px_32px_-16px_rgba(15,23,42,0.45)] hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-18px_rgba(15,23,42,0.55)]`
          : 'bg-card/85 border-border/70 shadow-[var(--surface-shadow)] backdrop-blur-xl hover:border-primary/30 hover:shadow-[var(--surface-shadow-hover)]'
      }`}
      style={showPreview && !showImagePreview ? { backgroundColor: tile.color } : undefined}
      aria-label={tileName}
    >
      {showPreview && showImagePreview && (
        <Image
          src={projectCoverAsset(coverImage!)}
          alt={tileName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 960px"
          onError={handleImageError}
          quality={PERFORMANCE.IMAGE_QUALITY}
        />
      )}

      {showPreview && (
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: showImagePreview
              ? 'linear-gradient(90deg, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.36) 45%, rgba(15,23,42,0.18) 100%)'
              : `linear-gradient(135deg, color-mix(in oklab, ${tile.color} 88%, black) 0%, color-mix(in oklab, ${tile.color} 70%, black) 100%)`,
          }}
        />
      )}

      {/* 图标 */}
      <div
        className={`relative z-[2] flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${
          showPreview ? 'bg-black/20 text-white backdrop-blur-[2px]' : ''
        }`}
        style={showPreview ? undefined : tileTintStyle(tile.color)}
      >
        {tile.icon && (
          <div className="flex h-5 w-5 items-center justify-center sm:h-6 sm:w-6">{tile.icon}</div>
        )}
      </div>

      {/* 标题 */}
      <div className="relative z-[2] min-w-0 flex-1">
        <span className={`${contentTextClassName} text-base font-medium leading-tight`}>
          {tileName}
        </span>
      </div>

      {/* 右侧 */}
      <div className="relative z-[2] flex shrink-0 items-center gap-2">
        {needsLogin && (
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              showPreview ? 'bg-black/25 backdrop-blur-[2px]' : 'bg-muted'
            }`}
          >
            <Lock className={`h-3 w-3 ${showPreview ? 'text-white' : 'text-muted-foreground'}`} />
          </div>
        )}
        <ChevronRight
          aria-hidden
          className={`size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none ${
            showPreview ? 'text-white/80' : 'text-muted-foreground/70'
          }`}
        />
      </div>
    </button>
  )
})

ListCard.displayName = 'ListCard'

/** 杂志风格布局：所有卡片统一列表样式 */
export const MagazineLayout = memo(
  ({
    tiles,
    projectCoverMode,
    getTileStatus,
    handleTileClick,
  }: {
    tiles: Tile[]
    projectCoverMode: ProjectCoverMode
    getTileStatus: (tile: Tile) => { needsLogin: boolean }
    handleTileClick: (tile: Tile) => void
  }) => {
    if (tiles.length === 0) return null

    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {tiles.map(tile => {
          const tileStatus = getTileStatus(tile)
          return (
            <ListCard
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
  }
)

MagazineLayout.displayName = 'MagazineLayout'
