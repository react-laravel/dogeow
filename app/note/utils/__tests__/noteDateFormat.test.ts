import { describe, expect, it } from 'vitest'
import { formatNoteDate } from '../noteDateFormat'

describe('noteDateFormat', () => {
  it('should format a valid date string', () => {
    const result = formatNoteDate('2024-06-15T10:30:00Z')
    expect(result).toBe('2024年06月15日 18:30')
  })

  it('should handle a date at midnight', () => {
    const result = formatNoteDate('2024-01-01T00:00:00Z')
    expect(result).toBe('2024年01月01日 08:00')
  })

  it('should handle a date at end of day', () => {
    const result = formatNoteDate('2024-12-31T23:59:59Z')
    expect(result).toBe('2025年01月01日 07:59')
  })

  it('should return original string for invalid date', () => {
    const invalidDate = 'not-a-date'
    const result = formatNoteDate(invalidDate)
    expect(result).toBe(invalidDate)
  })

  it('should return original string for empty string', () => {
    const result = formatNoteDate('')
    expect(result).toBe('')
  })

  it('should handle ISO 8601 format', () => {
    const result = formatNoteDate('2024-03-15T08:30:00+08:00')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle date without timezone', () => {
    const result = formatNoteDate('2024-06-15T10:30:00')
    expect(typeof result).toBe('string')
  })

  it('should handle future dates', () => {
    const futureDate = '2030-12-31T23:59:59Z'
    const result = formatNoteDate(futureDate)
    expect(result).toBe('2031年01月01日 07:59')
  })

  it('should handle past dates', () => {
    const pastDate = '2000-01-01T00:00:00Z'
    const result = formatNoteDate(pastDate)
    expect(result).toBe('2000年01月01日 08:00')
  })
})
