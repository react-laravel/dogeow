import { describe, it, expect } from 'vitest'
import {
  getMoonDiceCounts,
  getMoonDiceRank,
  getMoonDiceRankMeta,
  compareMoonDiceRank,
  MOON_DICE_RANK_ORDER,
  MOON_DICE_RANK_META,
} from '../moonDiceRules'

describe('getMoonDiceCounts', () => {
  it('should count dice faces', () => {
    const counts = getMoonDiceCounts([1, 2, 3, 4, 5, 6])
    expect(counts).toEqual({ 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 })
  })

  it('should count duplicates', () => {
    const counts = getMoonDiceCounts([4, 4, 4, 4, 4, 4])
    expect(counts).toEqual({ 1: 0, 2: 0, 3: 0, 4: 6, 5: 0, 6: 0 })
  })

  it('should handle empty array', () => {
    const counts = getMoonDiceCounts([])
    expect(counts).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 })
  })

  it('should ignore invalid values', () => {
    const counts = getMoonDiceCounts([1, 0, 7, 'x', 2, null] as unknown as number[])
    expect(counts).toEqual({ 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0 })
  })

  it('should ignore non-integer values', () => {
    const counts = getMoonDiceCounts([1.5, 2, 3.9, 4])
    expect(counts).toEqual({ 1: 0, 2: 1, 3: 0, 4: 1, 5: 0, 6: 0 })
  })
})

describe('getMoonDiceRank', () => {
  it('should return "none" for all zeros', () => {
    expect(getMoonDiceRank([0, 0, 0, 0, 0, 0])).toBe('none')
  })

  it('should return "yx" for one 4 (not a full set)', () => {
    // [4,1,2,3,5,6] matches "by" (one of each) before "yx" (one 4)
    expect(getMoonDiceRank([4, 1, 1, 2, 2, 3])).toBe('yx')
  })

  it('should return "eq" for two 4s', () => {
    expect(getMoonDiceRank([4, 4, 1, 2, 3, 5])).toBe('eq')
  })

  it('should return "sh" for three 4s', () => {
    expect(getMoonDiceRank([4, 4, 4, 1, 2, 3])).toBe('sh')
  })

  it('should return "sj" for four of any non-4', () => {
    expect(getMoonDiceRank([1, 1, 1, 1, 2, 3])).toBe('sj')
    expect(getMoonDiceRank([2, 2, 2, 2, 3, 4])).toBe('sj')
    expect(getMoonDiceRank([6, 6, 6, 6, 1, 2])).toBe('sj')
  })

  it('should return "zy" for four 4s', () => {
    expect(getMoonDiceRank([4, 4, 4, 4, 1, 2])).toBe('zy')
  })

  it('should return "by" for one of each (1-6)', () => {
    expect(getMoonDiceRank([1, 2, 3, 4, 5, 6])).toBe('by')
  })

  it('should return "wzdk" for five of any non-4', () => {
    expect(getMoonDiceRank([1, 1, 1, 1, 1, 2])).toBe('wzdk')
    expect(getMoonDiceRank([5, 5, 5, 5, 5, 6])).toBe('wzdk')
  })

  it('should return "ww" for five 4s', () => {
    expect(getMoonDiceRank([4, 4, 4, 4, 4, 1])).toBe('ww')
  })

  it('should return "bdj" for six of any non-4', () => {
    expect(getMoonDiceRank([1, 1, 1, 1, 1, 1])).toBe('bdj')
    expect(getMoonDiceRank([2, 2, 2, 2, 2, 2])).toBe('bdj')
    expect(getMoonDiceRank([6, 6, 6, 6, 6, 6])).toBe('bdj')
  })

  it('should return "wzdyx" for five + one 4', () => {
    expect(getMoonDiceRank([1, 1, 1, 1, 1, 4])).toBe('wzdyx')
    expect(getMoonDiceRank([5, 5, 5, 5, 5, 4])).toBe('wzdyx')
  })

  it('should return "lbh" for six 4s', () => {
    expect(getMoonDiceRank([4, 4, 4, 4, 4, 4])).toBe('lbh')
  })

  it('should accept DiceCounts input', () => {
    expect(getMoonDiceRank({ 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 })).toBe('by')
    expect(getMoonDiceRank({ 4: 6, 1: 0, 2: 0, 3: 0, 5: 0, 6: 0 })).toBe('lbh')
  })
})

describe('getMoonDiceRankMeta', () => {
  it('should return meta for a rank string', () => {
    const meta = getMoonDiceRankMeta('by')
    expect(meta.rank).toBe('by')
    expect(meta.name).toBe('榜眼')
    expect(meta.money).toBe(1.23)
  })

  it('should return meta for dice array', () => {
    const meta = getMoonDiceRankMeta([1, 2, 3, 4, 5, 6])
    expect(meta.rank).toBe('by')
  })

  it('should return "none" meta for no match', () => {
    const meta = getMoonDiceRankMeta([0, 0, 0, 0, 0, 0])
    expect(meta.rank).toBe('none')
    expect(meta.money).toBe(0.01)
  })
})

describe('compareMoonDiceRank', () => {
  it('should return positive when a has lower rank (later in order)', () => {
    // 'yx' is at index 11, 'by' is at index 7; yx is a lower rank
    expect(compareMoonDiceRank('yx', 'by')).toBeGreaterThan(0)
  })

  it('should return negative when a has higher rank (earlier in order)', () => {
    // 'by' is at index 7, 'yx' is at index 11; by is a higher rank
    expect(compareMoonDiceRank('by', 'yx')).toBeLessThan(0)
  })

  it('should return 0 when a === b', () => {
    expect(compareMoonDiceRank('yx', 'yx')).toBe(0)
  })

  it('should rank cjh as highest', () => {
    expect(compareMoonDiceRank('cjh', 'lbh')).toBeLessThan(0)
    expect(compareMoonDiceRank('lbh', 'cjh')).toBeGreaterThan(0)
  })

  it('should handle unknown ranks', () => {
    expect(compareMoonDiceRank('unknown', 'yx')).toBeGreaterThan(0)
    expect(compareMoonDiceRank('yx', 'unknown')).toBeLessThan(0)
  })
})

describe('MOON_DICE_RANK_META', () => {
  it('should have meta for all ranks', () => {
    const ranks = Object.keys(MOON_DICE_RANK_META) as Array<keyof typeof MOON_DICE_RANK_META>
    expect(ranks).toHaveLength(13) // 12 ranks + 'none'
  })

  it('should have required fields in each meta', () => {
    for (const [rank, meta] of Object.entries(MOON_DICE_RANK_META)) {
      expect(meta.rank).toBe(rank)
      expect(meta.name).toBeTruthy()
      expect(typeof meta.money).toBe('number')
    }
  })
})
