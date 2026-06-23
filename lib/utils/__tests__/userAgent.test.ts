import { describe, it, expect } from 'vitest'
import { getBrowserInfo, getOSInfo, isMobileDevice } from '../userAgent'

describe('userAgent', () => {
  describe('getBrowserInfo', () => {
    it('should return unknown for empty userAgent', () => {
      const result = getBrowserInfo()
      expect(result.label).toBe('未知浏览器')
    })

    it('should return unknown for empty string userAgent', () => {
      const result = getBrowserInfo('')
      expect(result.label).toBe('未知浏览器')
    })

    it('should detect Chrome', () => {
      const result = getBrowserInfo(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      )
      expect(result.label).toBe('Chrome')
    })

    it('should detect Chrome but not Edge/Opera', () => {
      const result = getBrowserInfo(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      )
      expect(result.label).toBe('Chrome')
    })

    it('should detect Edge', () => {
      const result = getBrowserInfo(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'
      )
      expect(result.label).toBe('Edge')
    })

    it('should detect Firefox', () => {
      const result = getBrowserInfo(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0'
      )
      expect(result.label).toBe('Firefox')
    })

    it('should detect Safari', () => {
      const result = getBrowserInfo(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
      )
      expect(result.label).toBe('Safari')
    })

    it('should not detect Chrome as Safari', () => {
      const result = getBrowserInfo(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      )
      expect(result.label).toBe('Chrome')
    })

    it('should return other browser for unknown agents', () => {
      const result = getBrowserInfo('SomeUnknownBrowser/1.0')
      expect(result.label).toBe('其他浏览器')
    })
  })

  describe('getOSInfo', () => {
    it('should return unknown for empty userAgent', () => {
      const result = getOSInfo()
      expect(result.label).toBe('未知设备')
    })

    it('should detect Windows', () => {
      const result = getOSInfo(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      )
      expect(result.label).toBe('Windows')
    })

    it('should detect iOS (iPhone)', () => {
      const result = getOSInfo(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      )
      expect(result.label).toBe('Apple iOS')
    })

    it('should detect iOS (iPad)', () => {
      const result = getOSInfo(
        'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      )
      expect(result.label).toBe('Apple iOS')
    })

    it('should detect macOS', () => {
      const result = getOSInfo(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      )
      expect(result.label).toBe('Apple macOS')
    })

    it('should detect BlackBerry', () => {
      const result = getOSInfo(
        'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en) AppleWebKit/534.11+ (KHTML, like Gecko) Version/7.1.0.346 Mobile Safari/534.11+'
      )
      expect(result.label).toBe('BlackBerry')
    })

    it('should detect Android', () => {
      const result = getOSInfo(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
      )
      expect(result.label).toBe('Android')
    })

    it('should return other OS for unknown agents', () => {
      const result = getOSInfo('SomeUnknownOS/1.0')
      expect(result.label).toBe('其他设备')
    })
  })

  describe('isMobileDevice', () => {
    const originalNavigator = global.navigator
    const originalWindow = global.window

    afterEach(() => {
      global.navigator = originalNavigator
      global.window = originalWindow
    })

    it('should return true for Android user agent', () => {
      global.navigator = {
        userAgent:
          'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        maxTouchPoints: 1,
      } as Navigator & { maxTouchPoints: number }
      global.window = { ontouchstart: null } as Window & { ontouchstart: (() => void) | null }

      expect(isMobileDevice()).toBe(true)
    })

    it('should return true for iPhone user agent', () => {
      global.navigator = {
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        maxTouchPoints: 5,
      } as Navigator & { maxTouchPoints: number }
      global.window = { ontouchstart: null } as Window & { ontouchstart: (() => void) | null }

      expect(isMobileDevice()).toBe(true)
    })

    it('should return true when ontouchstart is present', () => {
      global.navigator = {
        userAgent: 'SomeBot/1.0',
        maxTouchPoints: 0,
      } as unknown as Navigator
      global.window = { ontouchstart: () => {} } as unknown as Window

      expect(isMobileDevice()).toBe(true)
    })

    it('should return true when maxTouchPoints > 0', () => {
      global.navigator = {
        userAgent: 'SomeBot/1.0',
        maxTouchPoints: 2,
      } as Navigator & { maxTouchPoints: number }
      global.window = { ontouchstart: null } as Window & { ontouchstart: (() => void) | null }

      expect(isMobileDevice()).toBe(true)
    })

    it('should return false for desktop user agent without touch', () => {
      const desktopWindow = {} as Window
      delete (desktopWindow as Record<string, unknown>).ontouchstart
      global.window = desktopWindow
      global.navigator = {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        maxTouchPoints: 0,
      } as unknown as Navigator

      expect(isMobileDevice()).toBe(false)
    })
  })
})
