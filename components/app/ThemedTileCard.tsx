import { TileCard } from './TileCard'
import type { Tile } from '@/app/types'
import type { ProjectCoverMode } from '@/stores/projectCoverStore'

interface ThemedTileCardProps {
  tile: Tile
  index: number
  customStyles?: string
  projectCoverMode: ProjectCoverMode
  needsLogin: boolean
  onClick: () => void
}

/** 统一卡片入口；保留组件名以兼容现有调用。 */
export function ThemedTileCard(props: ThemedTileCardProps) {
  return <TileCard {...props} />
}
