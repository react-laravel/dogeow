'use client'

import { useMemo, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import { configs } from '@/app/configs'
import { ThemedTileCard } from '@/components/app/ThemedTileCard'
import { HomeTilesSkeleton } from '@/components/app/HomeTilesSkeleton'
import { useTileManagement } from '@/hooks/useTileManagement'
import { PageContainer } from '@/components/layout'
import { useUITheme } from '@/components/themes/UIThemeProvider'
import { useLayoutStore } from '@/stores/layoutStore'
import { useTranslation } from '@/hooks/useTranslation'
import type { Tile } from '@/app/types'
import type { ProjectCoverMode } from '@/stores/projectCoverStore'

const MagazineLayout = dynamic(
  () => import('@/components/app/MagazineLayout').then(mod => mod.MagazineLayout),
  { ssr: true }
)
const IconLayout = dynamic(
  () => import('@/components/app/IconLayout').then(mod => mod.IconLayout),
  {
    ssr: true,
  }
)

const Footer = dynamic(() => import('@/components/app/Footer'), {
  ssr: true,
})

const HOME_TILES_GAP = 'gap-4'
const HOME_LIST_GAP = 'space-y-4'
const HOME_SECTION_SPACING = 'space-y-6'

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

function MagazineSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-card/70 rounded-xl border border-white/10 p-4">
          <div className="bg-white/20 h-6 w-3/4 rounded mb-3" />
          <div className="bg-white/10 h-4 w-full rounded mb-2" />
          <div className="bg-white/10 h-4 w-2/3 rounded" />
        </div>
      ))}
    </div>
  )
}

function IconSkeleton() {
  return (
    <div className="animate-pulse grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <div className="bg-white/20 h-12 w-12 rounded-xl" />
          <div className="bg-white/10 h-3 w-10 rounded" />
        </div>
      ))}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-card/70 rounded-xl border border-white/10 p-4">
          <div className="bg-white/20 h-5 w-16 rounded mb-3" />
          <div className="bg-white/10 h-4 w-full rounded mb-2" />
          <div className="bg-white/10 h-4 w-3/4 rounded" />
        </div>
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-card/70 rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 h-8 w-8 rounded-lg" />
            <div className="flex-1">
              <div className="bg-white/20 h-4 w-24 rounded mb-2" />
              <div className="bg-white/10 h-3 w-48 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function TileList({
  tiles,
  projectCoverMode,
  getTileStatus,
  onTileClick,
}: {
  tiles: Tile[]
  projectCoverMode: ProjectCoverMode
  getTileStatus: (tile: Tile) => { needsLogin: boolean }
  onTileClick: (tile: Tile) => void
}) {
  return (
    <>
      {tiles.map((tile, index) => {
        const tileStatus = getTileStatus(tile)
        return (
          <ThemedTileCard
            key={tile.name}
            tile={tile}
            index={index}
            projectCoverMode={projectCoverMode}
            needsLogin={tileStatus.needsLogin}
            onClick={() => onTileClick(tile)}
          />
        )
      })}
    </>
  )
}

export function HomePage() {
  const { tiles, projectCoverMode, handleTileClick, getTileStatus } = useTileManagement()
  const theme = useUITheme()
  const { siteLayout } = useLayoutStore()
  const { t } = useTranslation()
  const isHydrated = useHydrated()

  const layoutType = useMemo(() => {
    if (siteLayout === 'icon') return 'icon'
    if (siteLayout === 'magazine') return 'magazine'
    if (!theme || theme.id === 'default') return 'grid'
    if (theme.id === 'dashboard') return 'dashboard'
    return 'list'
  }, [siteLayout, theme])

  return (
    <>
      <PageContainer className={`py-4 sm:py-6 ${HOME_SECTION_SPACING}`}>
        <header className="space-y-1">
          <h1 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
            {t('home.title', 'DogeOW - 个人工具和游戏平台')}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t('home.description', '一个以自用和测试为主的个人工具平台，欢迎来到我的数字后花园！')}
          </p>
        </header>

        <section aria-label={t('home.section_tiles', '应用入口')}>
          {!isHydrated ? (
            layoutType === 'magazine' ? (
              <MagazineSkeleton />
            ) : layoutType === 'icon' ? (
              <IconSkeleton />
            ) : layoutType === 'dashboard' ? (
              <DashboardSkeleton />
            ) : layoutType === 'grid' ? (
              <HomeTilesSkeleton />
            ) : (
              <ListSkeleton />
            )
          ) : layoutType === 'magazine' ? (
            <MagazineLayout
              tiles={tiles}
              projectCoverMode={projectCoverMode}
              getTileStatus={getTileStatus}
              handleTileClick={handleTileClick}
            />
          ) : layoutType === 'icon' ? (
            <IconLayout
              tiles={tiles}
              projectCoverMode={projectCoverMode}
              getTileStatus={getTileStatus}
              handleTileClick={handleTileClick}
            />
          ) : layoutType === 'grid' ? (
            <div
              className={`grid ${HOME_TILES_GAP}`}
              style={{
                gridTemplateAreas: configs.gridLayout.templateAreas,
                gridTemplateColumns: `repeat(${configs.gridLayout.columns}, minmax(0, 1fr))`,
              }}
              role="grid"
              aria-label="应用程序网格"
            >
              {tiles.map((tile, index) => {
                const tileStatus = getTileStatus(tile)
                return (
                  <div key={tile.name} style={{ gridArea: tile.name }}>
                    <ThemedTileCard
                      tile={tile}
                      index={index}
                      projectCoverMode={projectCoverMode}
                      needsLogin={tileStatus.needsLogin}
                      onClick={() => handleTileClick(tile)}
                    />
                  </div>
                )
              })}
            </div>
          ) : layoutType === 'dashboard' ? (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${HOME_TILES_GAP}`}>
              <TileList
                tiles={tiles}
                projectCoverMode={projectCoverMode}
                getTileStatus={getTileStatus}
                onTileClick={handleTileClick}
              />
            </div>
          ) : (
            <div className={HOME_LIST_GAP}>
              <TileList
                tiles={tiles}
                projectCoverMode={projectCoverMode}
                getTileStatus={getTileStatus}
                onTileClick={handleTileClick}
              />
            </div>
          )}
        </section>
      </PageContainer>

      <Footer />
    </>
  )
}
