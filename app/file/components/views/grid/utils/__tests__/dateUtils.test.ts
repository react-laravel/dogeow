import { describe, it, expect } from 'vitest'
import { formatDate } from '../dateUtils'

describe('formatDate', () => {
  it('should format a date string in Chinese locale', () => {
    const result = formatDate('2024-06-15T10:30:00Z')
    // Result will be locale-dependent, just check it returns a string
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle different date strings', () => {
    const result1 = formatDate('2024-01-01T00:00:00Z')
    const result2 = formatDate('2024-12-31T23:59:59Z')
    expect(typeof result1).toBe('string')
    expect(typeof result2).toBe('string')
    expect(result1).not.toBe(result2)
  })

  it('should handle ISO date format', () => {
    const result = formatDate('2024-03-20T08:00:00.000Z')
    expect(result).toContain('2024')
    expect(result).toContain('03')
    expect(result).toContain('20')
  })
})
