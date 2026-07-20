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
const getInitialTileStatus = (tile: { needLogin?: boolean }) => ({
  needsLogin: Boolean(tile.needLogin),
})

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

export function HomePage() {
  const { tiles, projectCoverMode, handleTileClick, getTileStatus } = useTileManagement()
  const { siteLayout } = useLayoutStore()
  const { t } = useTranslation()
  const isHydrated = useHydrated()
  const hydratedProjectCoverMode = isHydrated ? projectCoverMode : 'image'

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
            <IconLayout
              tiles={tiles}
              projectCoverMode={hydratedProjectCoverMode}
              getTileStatus={getInitialTileStatus}
              handleTileClick={handleTileClick}
            />
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
