import { describe, expect, it } from 'vitest'
import { buildCategoryTree } from '../buildCategoryTree'
import type { Category, CategoryWithChildren } from '../../types'

// ─── Factory helpers ───────────────────────────────────────────────────────────

const createCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 0,
  name: '',
  parent_id: null,
  sort_order: 0,
  ...overrides,
})

// ─── buildCategoryTree ─────────────────────────────────────────────────────────

describe('buildCategoryTree', () => {
  it('returns empty array for empty input', () => {
    const result = buildCategoryTree([])
    expect(result).toEqual([])
  })

  it('returns all root categories with empty children', () => {
    const categories = [
      createCategory({ id: 1, name: '电子产品' }),
      createCategory({ id: 2, name: '食品' }),
      createCategory({ id: 3, name: '服装' }),
    ]

    const result = buildCategoryTree(categories)

    expect(result).toHaveLength(3)
    expect(result.map(c => c.id)).toEqual([1, 2, 3])
    expect(result.every(c => c.children?.length === 0)).toBe(true)
  })

  it('nests child categories under their parent', () => {
    const categories = [
      createCategory({ id: 1, name: '电子产品', parent_id: null }),
      createCategory({ id: 2, name: '手机', parent_id: 1 }),
      createCategory({ id: 3, name: '电脑', parent_id: 1 }),
    ]

    const result = buildCategoryTree(categories)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
    expect(result[0].children).toHaveLength(2)
    expect(result[0].children!.map(c => c.name)).toEqual(['手机', '电脑'])
  })

  it('handles multiple parent categories with children', () => {
    const categories = [
      createCategory({ id: 1, name: '电子产品', parent_id: null }),
      createCategory({ id: 2, name: '食品', parent_id: null }),
      createCategory({ id: 3, name: '手机', parent_id: 1 }),
      createCategory({ id: 4, name: '零食', parent_id: 2 }),
    ]

    const result = buildCategoryTree(categories)

    expect(result).toHaveLength(2)

    const electronics = result.find(c => c.id === 1)!
    expect(electronics.children).toHaveLength(1)
    expect(electronics.children![0].id).toBe(3)

    const food = result.find(c => c.id === 2)!
    expect(food.children).toHaveLength(1)
    expect(food.children![0].id).toBe(4)
  })

  it('silently drops children whose parent_id does not match any category', () => {
    const categories = [
      createCategory({ id: 1, name: '电子产品', parent_id: null }),
      createCategory({ id: 2, name: '孤儿分类', parent_id: 999 }),
    ]

    const result = buildCategoryTree(categories)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
    expect(result[0].children).toEqual([])
  })

  it('handles deeply nested children (only one level)', () => {
    // Current implementation only supports one level of nesting
    const categories = [
      createCategory({ id: 1, name: '根', parent_id: null }),
      createCategory({ id: 2, name: '子', parent_id: 1 }),
      createCategory({ id: 3, name: '孙', parent_id: 2 }),
    ]

    const result = buildCategoryTree(categories)

    // 孙 is child of 子, but 子 is child of 根 → 孙 gets dropped since 子 is not in parentCategories
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
    expect(result[0].children).toHaveLength(1)
    expect(result[0].children![0].id).toBe(2)
  })

  it('collects multiple children under the same parent', () => {
    const categories = [
      createCategory({ id: 1, name: '根', parent_id: null }),
      createCategory({ id: 2, name: '子A', parent_id: 1 }),
      createCategory({ id: 3, name: '子B', parent_id: 1 }),
      createCategory({ id: 4, name: '子C', parent_id: 1 }),
    ]

    const result = buildCategoryTree(categories)

    expect(result[0].children).toHaveLength(3)
    expect(result[0].children!.map(c => c.id)).toEqual([2, 3, 4])
  })

  it('does not mutate the original categories array', () => {
    const categories = [
      createCategory({ id: 1, name: '根', parent_id: null }),
      createCategory({ id: 2, name: '子', parent_id: 1 }),
    ]

    buildCategoryTree(categories)

    expect(categories).toHaveLength(2)
    // Original items should not have a children property
    expect((categories[0] as CategoryWithChildren).children).toBeUndefined()
  })

  it('preserves all category properties in parent nodes', () => {
    const categories = [
      createCategory({ id: 1, name: '电子产品', parent_id: null, sort_order: 1 }),
      createCategory({ id: 2, name: '手机', parent_id: 1, sort_order: 2 }),
    ]

    const result = buildCategoryTree(categories)

    expect(result[0].id).toBe(1)
    expect(result[0].name).toBe('电子产品')
    expect(result[0].sort_order).toBe(1)
    expect(result[0].children![0].sort_order).toBe(2)
  })
})
