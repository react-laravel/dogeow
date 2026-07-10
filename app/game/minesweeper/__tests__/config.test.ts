import { describe, expect, it } from 'vitest'
import { getDynamicDifficulties } from '../config'

describe('getDynamicDifficulties', () => {
  it('keeps playable dimensions on very short landscape screens', () => {
    const difficulties = getDynamicDifficulties({ width: 800, height: 320 })

    expect(difficulties.medium.rows).toBeGreaterThanOrEqual(8)
    expect(difficulties.medium.cols).toBeGreaterThanOrEqual(8)
    expect(difficulties.hard.rows).toBeGreaterThanOrEqual(8)
    expect(difficulties.hard.cols).toBeGreaterThanOrEqual(8)
  })

  it('uses a compact portrait board width', () => {
    const difficulties = getDynamicDifficulties({ width: 390, height: 844 })

    expect(difficulties.easy).toEqual({ rows: 8, cols: 8, mines: 10 })
    expect(difficulties.medium.cols).toBeLessThanOrEqual(10)
    expect(difficulties.hard.cols).toBeLessThanOrEqual(12)
  })
})
