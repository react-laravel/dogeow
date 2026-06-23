import { describe, it, expect } from 'vitest'
import { searchItems } from '../utils/searchUtils'
import type { NavItem } from '@/app/nav/types'

const makeItem = (overrides: Partial<NavItem> = {}): NavItem => ({
  id: 1,
  nav_category_id: 1,
  name: 'Google',
  url: 'https://google.com',
  icon: null,
  description: 'Search engine',
  sort_order: 1,
  is_visible: true,
  is_new_window: false,
  clicks: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
  ...overrides,
})

describe('searchItems', () => {
  const items: NavItem[] = [
    makeItem({ id: 1, name: 'Google', url: 'https://google.com', description: 'Search engine' }),
    makeItem({ id: 2, name: 'GitHub', url: 'https://github.com', description: 'Code hosting' }),
    makeItem({
      id: 3,
      name: 'Stack Overflow',
      url: 'https://stackoverflow.com',
      description: 'Q&A for developers',
    }),
    makeItem({ id: 4, name: 'Reddit', url: 'https://reddit.com', description: null }),
  ]

  it('should return all items when term is empty', () => {
    expect(searchItems(items, '')).toEqual(items)
    expect(searchItems(items, '   ')).toEqual(items)
  })

  it('should search by name (case insensitive)', () => {
    expect(searchItems(items, 'google')).toEqual([items[0]])
    expect(searchItems(items, 'GOOGLE')).toEqual([items[0]])
    expect(searchItems(items, 'git')).toEqual([items[1]])
  })

  it('should search by URL', () => {
    expect(searchItems(items, 'stackoverflow')).toEqual([items[2]])
    expect(searchItems(items, 'reddit')).toEqual([items[3]])
  })

  it('should search by description', () => {
    expect(searchItems(items, 'search')).toEqual([items[0]])
    expect(searchItems(items, 'developers')).toEqual([items[2]])
  })

  it('should return empty array when no match', () => {
    expect(searchItems(items, 'xyznonexistent')).toEqual([])
  })

  it('should match partial terms', () => {
    expect(searchItems(items, 'goog')).toEqual([items[0]])
    expect(searchItems(items, 'stack')).toEqual([items[2]])
  })

  it('should not mutate original array', () => {
    const original = [...items]
    searchItems(items, 'google')
    expect(items).toEqual(original)
  })
})
