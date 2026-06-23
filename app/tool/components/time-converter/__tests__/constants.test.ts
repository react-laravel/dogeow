import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FORMAT,
  MIN_YEAR,
  MAX_YEAR,
  MILLISECOND_THRESHOLD,
  COPY_FEEDBACK_DURATION,
  FLEXIBLE_DATE_REGEX,
  STANDARD_DATE_FORMAT,
  ERROR_MESSAGES,
  ERROR_MESSAGE_LIST,
} from '../constants'

describe('time converter constants', () => {
  it('has correct default format', () => {
    expect(DEFAULT_FORMAT).toBe('yyyy-MM-dd HH:mm:ss')
  })

  it('has correct year bounds', () => {
    expect(MIN_YEAR).toBe(1970)
    expect(MAX_YEAR).toBe(2100)
    expect(MIN_YEAR).toBeLessThan(MAX_YEAR)
  })

  it('has correct millisecond threshold', () => {
    expect(MILLISECOND_THRESHOLD).toBe(13)
  })

  it('has correct copy feedback duration', () => {
    expect(COPY_FEEDBACK_DURATION).toBe(2000)
  })

  it('flexible date regex matches common formats', () => {
    expect(FLEXIBLE_DATE_REGEX.test('2024-01-15')).toBe(true)
    expect(FLEXIBLE_DATE_REGEX.test('2024-1-5')).toBe(true)
    expect(FLEXIBLE_DATE_REGEX.test('2024-01-15 10:30:00')).toBe(true)
    expect(FLEXIBLE_DATE_REGEX.test('2024-1-5 9:08:07')).toBe(true)
    expect(FLEXIBLE_DATE_REGEX.test('2024/01/15')).toBe(false)
    expect(FLEXIBLE_DATE_REGEX.test('not-a-date')).toBe(false)
  })

  it('standard date format matches default format', () => {
    expect(STANDARD_DATE_FORMAT).toBe(DEFAULT_FORMAT)
  })

  it('has all expected error messages', () => {
    expect(ERROR_MESSAGES.EMPTY_TIMESTAMP).toBe('请输入时间戳')
    expect(ERROR_MESSAGES.INVALID_TIMESTAMP).toBe('无效的时间戳')
    expect(ERROR_MESSAGES.CONVERSION_ERROR).toBe('转换出错')
    expect(ERROR_MESSAGES.EMPTY_DATETIME).toBe('请输入日期时间')
    expect(ERROR_MESSAGES.INVALID_DATE_FORMAT).toBe('日期格式应为 yyyy-M-d 或 yyyy-MM-dd HH:mm:ss')
    expect(ERROR_MESSAGES.INVALID_DATE).toBe('无效的日期格式')
    expect(typeof ERROR_MESSAGES.OUT_OF_RANGE).toBe('function')
  })

  it('OUT_OF_RANGE returns correct format', () => {
    expect(ERROR_MESSAGES.OUT_OF_RANGE(3000)).toBe('可能不正确的时间 (3000年)，请检查')
    expect(ERROR_MESSAGES.OUT_OF_RANGE(1800)).toBe('可能不正确的时间 (1800年)，请检查')
  })

  it('ERROR_MESSAGE_LIST has all 6 error strings', () => {
    expect(ERROR_MESSAGE_LIST).toHaveLength(6)
    expect(ERROR_MESSAGE_LIST).toContain(ERROR_MESSAGES.EMPTY_TIMESTAMP)
    expect(ERROR_MESSAGE_LIST).toContain(ERROR_MESSAGES.INVALID_TIMESTAMP)
    expect(ERROR_MESSAGE_LIST).toContain(ERROR_MESSAGES.CONVERSION_ERROR)
    expect(ERROR_MESSAGE_LIST).toContain(ERROR_MESSAGES.EMPTY_DATETIME)
    expect(ERROR_MESSAGE_LIST).toContain(ERROR_MESSAGES.INVALID_DATE_FORMAT)
    expect(ERROR_MESSAGE_LIST).toContain(ERROR_MESSAGES.INVALID_DATE)
  })

  it('ERROR_MESSAGE_LIST does not include OUT_OF_RANGE function', () => {
    expect(ERROR_MESSAGE_LIST).not.toContain(ERROR_MESSAGES.OUT_OF_RANGE)
  })
})
