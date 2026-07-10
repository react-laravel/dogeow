import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MinesweeperStats {
  easy: { gamesPlayed: number; gamesWon: number; bestTime: number }
  medium: { gamesPlayed: number; gamesWon: number; bestTime: number }
  hard: { gamesPlayed: number; gamesWon: number; bestTime: number }
}

interface MinesweeperState {
  stats: MinesweeperStats
  updateStats: (difficulty: 'easy' | 'medium' | 'hard', won: boolean, time?: number) => void
  resetStats: () => void
}

const createInitialStats = (): MinesweeperStats => ({
  easy: { gamesPlayed: 0, gamesWon: 0, bestTime: 0 },
  medium: { gamesPlayed: 0, gamesWon: 0, bestTime: 0 },
  hard: { gamesPlayed: 0, gamesWon: 0, bestTime: 0 },
})

export const useMinesweeperStore = create<MinesweeperState>()(
  persist(
    set => ({
      stats: createInitialStats(),
      updateStats: (difficulty: 'easy' | 'medium' | 'hard', won: boolean, time?: number) => {
        set(state => {
          const current = state.stats[difficulty]
          const nextBestTime =
            won &&
            time !== undefined &&
            time > 0 &&
            (current.bestTime === 0 || time < current.bestTime)
              ? time
              : current.bestTime

          return {
            stats: {
              ...state.stats,
              [difficulty]: {
                gamesPlayed: current.gamesPlayed + 1,
                gamesWon: current.gamesWon + (won ? 1 : 0),
                bestTime: nextBestTime,
              },
            },
          }
        })
      },
      resetStats: () => set({ stats: createInitialStats() }),
    }),
    {
      name: 'minesweeper-storage',
    }
  )
)
