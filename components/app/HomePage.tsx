'use client'

import { useMemo, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import { configs } from '@/app/configs'
import { ThemedTileCard } from '@/components/app/ThemedTileCard'
import { HomeTilesSkeleton } from '@/components/app/HomeTilesSkeleton'
import { useTileManagement } from '@/hooks/useTileManagement'
import { PageContainer } from '@/components/layout'
import { useLayoutStore } from '@/stores/layoutStore'
import { useTranslation } from '@/hooks/useTranslation'

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

function IconSkeleton({ count }: { count: number }) {
  return (
    <div className="grid animate-pulse grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="app-surface flex flex-col gap-2 p-2">
          <div className="bg-muted/70 aspect-square w-full rounded-xl" />
          <div className="bg-muted/70 mx-auto h-4 w-2/3 rounded" />
        </div>
      ))}
    </div>
  )
}

export function HomePage() {
  const { tiles, projectCoverMode, handleTileClick, getTileStatus } = useTileManagement()
  const { siteLayout } = useLayoutStore()
  const { t } = useTranslation()
  const isHydrated = useHydrated()

  const layoutType = useMemo(() => {
    if (siteLayout === 'icon') return 'icon'
    if (siteLayout === 'magazine') return 'magazine'
    return 'grid'
  }, [siteLayout])

  return (
    <>
      <PageContainer className={`py-5 sm:py-8 ${HOME_SECTION_SPACING}`}>
        <header className="max-w-3xl space-y-2">
          <div className="bg-primary/12 text-primary inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide">
            DIGITAL GARDEN
          </div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('home.title', 'DogeOW - 个人工具和游戏平台')}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-6 sm:text-base">
            {t('home.description', '一个以自用和测试为主的个人工具平台，欢迎来到我的数字后花园！')}
          </p>
        </header>

        <section aria-label={t('home.section_tiles', '应用入口')}>
          {!isHydrated ? (
            layoutType === 'magazine' ? (
              <MagazineSkeleton />
            ) : layoutType === 'icon' ? (
              <IconSkeleton count={tiles.length} />
            ) : (
              <HomeTilesSkeleton />
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
          ) : (
            <HomeTilesSkeleton />
          )}
        </section>
      </PageContainer>

      <Footer />
    </>
  )
}
