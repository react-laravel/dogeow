import { describe, it, expect } from 'vitest'
import { toPagination } from '../pagination'

describe('toPagination', () => {
  it('should convert paginated response with has_more true when next link exists', () => {
    const response = {
      data: [{ id: 1 }, { id: 2 }],
      meta: {
        current_page: 1,
        last_page: 3,
        per_page: 2,
        total: 6,
      },
      links: {
        next: 'http://example.com/page=2',
      },
    }

    const result = toPagination(response)

    expect(result.data).toEqual([{ id: 1 }, { id: 2 }])
    expect(result.current_page).toBe(1)
    expect(result.last_page).toBe(3)
    expect(result.per_page).toBe(2)
    expect(result.total).toBe(6)
    expect(result.has_more).toBe(true)
  })

  it('should convert paginated response with has_more based on page comparison', () => {
    const response = {
      data: [{ id: 3 }],
      meta: {
        current_page: 2,
        last_page: 3,
        per_page: 1,
        total: 3,
      },
      links: {
        next: null,
      },
    }

    const result = toPagination(response)

    expect(result.data).toEqual([{ id: 3 }])
    expect(result.current_page).toBe(2)
    expect(result.last_page).toBe(3)
    expect(result.has_more).toBe(true) // current_page < last_page
  })

  it('should handle missing meta fields with defaults', () => {
    const response = {
      data: [{ id: 1 }],
      meta: {},
      links: {},
    }

    const result = toPagination(response)

    expect(result.current_page).toBe(1)
    expect(result.last_page).toBe(1)
    expect(result.per_page).toBe(1)
    expect(result.total).toBe(1)
    expect(result.has_more).toBe(false)
  })

  it('should handle completely empty response', () => {
    const response = {
      data: [],
      meta: undefined,
      links: undefined,
    }

    const result = toPagination(response)

    expect(result.data).toEqual([])
    expect(result.current_page).toBe(1)
    expect(result.last_page).toBe(1)
    expect(result.per_page).toBe(0)
    expect(result.total).toBe(0)
    expect(result.has_more).toBe(false)
  })

  it('should set has_more to false when on last page with no next link', () => {
    const response = {
      data: [{ id: 5 }, { id: 6 }],
      meta: {
        current_page: 3,
        last_page: 3,
        per_page: 2,
        total: 6,
      },
      links: {
        next: null,
      },
    }

    const result = toPagination(response)

    expect(result.has_more).toBe(false)
  })
})
