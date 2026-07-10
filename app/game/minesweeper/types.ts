export type CellState = 'hidden' | 'revealed' | 'flagged'

export interface Cell {
  isMine: boolean
  neighborCount: number
  state: CellState
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface DifficultyConfig {
  rows: number
  cols: number
  mines: number
}

export type DifficultyMap = Record<Difficulty, DifficultyConfig>
export type MinesweeperGameState = 'playing' | 'won' | 'lost'
