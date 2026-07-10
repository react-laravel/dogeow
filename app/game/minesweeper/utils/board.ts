import type { Cell } from '../types'

export function createEmptyBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      neighborCount: 0,
      state: 'hidden' as const,
    }))
  )
}
