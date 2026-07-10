import type { Difficulty, DifficultyMap } from './types'

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

const SERVER_DIFFICULTIES: DifficultyMap = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 15, cols: 12, mines: 27 },
  hard: { rows: 20, cols: 15, mines: 48 },
}

interface ViewportSize {
  width: number
  height: number
}

export function getDynamicDifficulties(viewport?: ViewportSize): DifficultyMap {
  const currentViewport =
    viewport ??
    (typeof window === 'undefined'
      ? null
      : { width: window.innerWidth, height: window.innerHeight })

  if (!currentViewport) return SERVER_DIFFICULTIES

  const { width, height } = currentViewport
  const isPortrait = height > width
  const availableWidth = Math.max(256, Math.min(width - 32, 1000))
  const availableHeight = Math.max(256, height - 400)
  const maxCols = Math.max(8, Math.floor(availableWidth / 32))
  const maxRows = Math.max(8, Math.floor(availableHeight / 32))

  if (isPortrait || width < 768) {
    const mediumRows = 15
    const mediumCols = Math.min(10, maxCols)
    const hardRows = 20
    const hardCols = Math.min(12, maxCols)

    return {
      easy: { rows: 8, cols: 8, mines: 10 },
      medium: {
        rows: mediumRows,
        cols: mediumCols,
        mines: Math.floor(mediumRows * mediumCols * 0.15),
      },
      hard: {
        rows: hardRows,
        cols: hardCols,
        mines: Math.floor(hardRows * hardCols * 0.17),
      },
    }
  }

  const mediumRows = Math.min(13, maxRows)
  const mediumCols = Math.min(15, maxCols)
  const hardRows = Math.min(16, maxRows)
  const hardCols = Math.min(30, maxCols)

  return {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: {
      rows: mediumRows,
      cols: mediumCols,
      mines: Math.floor(mediumRows * mediumCols * 0.15),
    },
    hard: {
      rows: hardRows,
      cols: hardCols,
      mines: Math.floor(hardRows * hardCols * 0.16),
    },
  }
}
