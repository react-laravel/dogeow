import { describe, it, expect } from 'vitest'
import {
  TIMEZONE_LANGUAGE_MAP,
  getLanguageFromTimezone,
  getSupportedTimezones,
} from '../timezone-map'
import type { SupportedLanguage } from '../translations'

describe('timezone-map', () => {
  describe('TIMEZONE_LANGUAGE_MAP', () => {
    it('should contain Asia timezone mappings', () => {
      expect(TIMEZONE_LANGUAGE_MAP['Asia/Shanghai']).toBe('zh-CN')
      expect(TIMEZONE_LANGUAGE_MAP['Asia/Hong_Kong']).toBe('zh-CN')
      expect(TIMEZONE_LANGUAGE_MAP['Asia/Chongqing']).toBe('zh-CN')
      expect(TIMEZONE_LANGUAGE_MAP['Asia/Urumqi']).toBe('zh-CN')
      expect(TIMEZONE_LANGUAGE_MAP['Asia/Taipei']).toBe('zh-TW')
      expect(TIMEZONE_LANGUAGE_MAP['Asia/Tokyo']).toBe('ja')
      expect(TIMEZONE_LANGUAGE_MAP['Asia/Seoul']).toBe('en')
    })

    it('should contain Americas timezone mappings', () => {
      expect(TIMEZONE_LANGUAGE_MAP['America/New_York']).toBe('en')
      expect(TIMEZONE_LANGUAGE_MAP['America/Los_Angeles']).toBe('en')
      expect(TIMEZONE_LANGUAGE_MAP['America/Chicago']).toBe('en')
      expect(TIMEZONE_LANGUAGE_MAP['America/Denver']).toBe('en')
      expect(TIMEZONE_LANGUAGE_MAP['America/Toronto']).toBe('en')
      expect(TIMEZONE_LANGUAGE_MAP['America/Vancouver']).toBe('en')
    })

    it('should contain Europe timezone mappings', () => {
      expect(TIMEZONE_LANGUAGE_MAP['Europe/London']).toBe('en')
      expect(TIMEZONE_LANGUAGE_MAP['Europe/Paris']).toBe('en')
      expect(TIMEZONE_LANGUAGE_MAP['Europe/Berlin']).toBe('en')
      expect(TIMEZONE_LANGUAGE_MAP['Europe/Rome']).toBe('en')
      expect(TIMEZONE_LANGUAGE_MAP['Europe/Madrid']).toBe('en')
      expect(TIMEZONE_LANGUAGE_MAP['Europe/Amsterdam']).toBe('en')
    })

    it('should contain Oceania timezone mappings', () => {
      expect(TIMEZONE_LANGUAGE_MAP['Australia/Sydney']).toBe('en')
      expect(TIMEZONE_LANGUAGE_MAP['Australia/Melbourne']).toBe('en')
      expect(TIMEZONE_LANGUAGE_MAP['Pacific/Auckland']).toBe('en')
    })
  })

  describe('getLanguageFromTimezone', () => {
    it('should return language for known timezones', () => {
      expect(getLanguageFromTimezone('Asia/Shanghai')).toBe('zh-CN')
      expect(getLanguageFromTimezone('Asia/Tokyo')).toBe('ja')
      expect(getLanguageFromTimezone('America/New_York')).toBe('en')
      expect(getLanguageFromTimezone('Europe/London')).toBe('en')
      expect(getLanguageFromTimezone('Australia/Sydney')).toBe('en')
    })

    it('should return null for unknown timezones', () => {
      expect(getLanguageFromTimezone('Unknown/Timezone')).toBeNull()
      expect(getLanguageFromTimezone('')).toBeNull()
    })
  })

  describe('getSupportedTimezones', () => {
    it('should return all timezone keys', () => {
      const timezones = getSupportedTimezones()
      expect(timezones.length).toBeGreaterThan(0)
      expect(timezones).toContain('Asia/Shanghai')
      expect(timezones).toContain('America/New_York')
      expect(timezones).toContain('Europe/London')
    })

    it('should return only strings', () => {
      const timezones = getSupportedTimezones()
      timezones.forEach(tz => {
        expect(typeof tz).toBe('string')
      })
    })
  })
})
