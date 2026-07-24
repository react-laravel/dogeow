'use client'

import { useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import { configs } from '@/app/configs'
import type { Tile } from '@/app/types'
import { ThemedTileCard } from '@/components/app/ThemedTileCard'
import { PageContainer } from '@/components/layout'
import { useTileManagement } from '@/hooks/useTileManagement'
import { useTranslation } from '@/hooks/useTranslation'
import { useLayoutStore, type SiteLayout } from '@/stores/layoutStore'
import type { ProjectCoverMode } from '@/stores/projectCoverStore'

const MagazineLayout = dynamic(
  () => import('@/components/app/MagazineLayout').then(mod => mod.MagazineLayout),
  { ssr: true }
)
const IconLayout = dynamic(
  () => import('@/components/app/IconLayout').then(mod => mod.IconLayout),
  { ssr: true }
)
const Footer = dynamic(() => import('@/components/app/Footer'), { ssr: true })

const HOME_TILES_GAP = 'gap-4'

type TileStatusGetter = (tile: Tile) => { needsLogin: boolean }

interface TileLayoutProps {
  tiles: Tile[]
  projectCoverMode: ProjectCoverMode
  getTileStatus: TileStatusGetter
  handleTileClick: (tile: Tile) => void
}

const getInitialTileStatus: TileStatusGetter = tile => ({
  needsLogin: Boolean(tile.needLogin),
})

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

function GridLayout({ tiles, projectCoverMode, getTileStatus, handleTileClick }: TileLayoutProps) {
  const { t } = useTranslation()

  return (
    <div
      className={`grid ${HOME_TILES_GAP}`}
      style={{
        gridTemplateAreas: configs.gridLayout.templateAreas,
        gridTemplateColumns: `repeat(${configs.gridLayout.columns}, minmax(0, 1fr))`,
      }}
    >
      {tiles.map((tile, index) => (
        <div key={tile.name} style={{ gridArea: tile.name }}>
          <ThemedTileCard
            tile={tile}
            index={index}
            projectCoverMode={projectCoverMode}
            needsLogin={getTileStatus(tile).needsLogin}
            onClick={() => handleTileClick(tile)}
          />
        </div>
      ))}
    </div>
  )
}

function HomeTiles({ layout, ...layoutProps }: TileLayoutProps & { layout: SiteLayout }) {
  if (layout === 'magazine') return <MagazineLayout {...layoutProps} />
  if (layout === 'grid') return <GridLayout {...layoutProps} />
  return <IconLayout {...layoutProps} />
}

export function HomePage() {
  const { tiles, projectCoverMode, handleTileClick, getTileStatus } = useTileManagement()
  const siteLayout = useLayoutStore(state => state.siteLayout)
  const { t } = useTranslation()
  const isHydrated = useHydrated()

  // SSR / 首屏固定 icon，避免与本地持久化布局不一致导致闪烁
  const layout: SiteLayout = isHydrated ? siteLayout : 'icon'
  const coverMode: ProjectCoverMode = isHydrated ? projectCoverMode : 'image'
  const statusGetter = isHydrated ? getTileStatus : getInitialTileStatus

  return (
    <>
      <PageContainer className="space-y-6 py-5 sm:py-8">
        <header className="max-w-3xl space-y-2">
          <div className="bg-primary/12 text-primary inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide">
            {t('home.eyebrow', '数字后花园')}
          </div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('home.title', 'DogeOW - 个人工具和游戏平台')}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-6 sm:text-base">
            {t('home.description', '一个以自用和测试为主的个人工具平台，欢迎来到我的数字后花园！')}
          </p>
        </header>

        <section aria-label={t('home.section_tiles', '应用入口')}>
          <HomeTiles
            layout={layout}
            tiles={tiles}
            projectCoverMode={coverMode}
            getTileStatus={statusGetter}
            handleTileClick={handleTileClick}
          />
        </section>
      </PageContainer>

      <Footer />
    </>
  )
}
