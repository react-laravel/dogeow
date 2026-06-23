import { describe, expect, it } from 'vitest'
import {
  APP_NAME,
  APP_DESCRIPTION,
  PERFORMANCE,
  SIZES,
  ANIMATIONS,
  STORAGE_KEYS,
  API,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  UPYUN_CDN_URL,
  FOOTER_BG_IMAGES_LIGHT,
} from '../index'

describe('constants', () => {
  describe('APP_NAME', () => {
    it('should be DogeOW', () => {
      expect(APP_NAME).toBe('DogeOW')
    })
  })

  describe('APP_DESCRIPTION', () => {
    it('should have a description', () => {
      expect(APP_DESCRIPTION).toContain('DogeOW')
      expect(APP_DESCRIPTION.length).toBeGreaterThan(0)
    })
  })

  describe('PERFORMANCE', () => {
    it('should have IMAGE_QUALITY', () => {
      expect(PERFORMANCE.IMAGE_QUALITY).toBe(85)
    })

    it('should have LOADING_DEBOUNCE', () => {
      expect(PERFORMANCE.LOADING_DEBOUNCE).toBe(300)
    })

    it('should have SCROLL_THROTTLE', () => {
      expect(PERFORMANCE.SCROLL_THROTTLE).toBe(100)
    })

    it('should have SEARCH_DEBOUNCE', () => {
      expect(PERFORMANCE.SEARCH_DEBOUNCE).toBe(500)
    })
  })

  describe('SIZES', () => {
    it('should have TILE_MIN_HEIGHT', () => {
      expect(SIZES.TILE_MIN_HEIGHT).toBe('8rem')
    })

    it('should have CONTENT_MAX_WIDTH', () => {
      expect(SIZES.CONTENT_MAX_WIDTH).toBe('7xl')
    })

    it('should have PREVIEW_MAX_LENGTH', () => {
      expect(SIZES.PREVIEW_MAX_LENGTH).toBe(150)
    })
  })

  describe('ANIMATIONS', () => {
    it('should have TRANSITION_DURATION', () => {
      expect(ANIMATIONS.TRANSITION_DURATION).toBe(200)
    })

    it('should have HOVER_SCALE', () => {
      expect(ANIMATIONS.HOVER_SCALE).toBe(0.95)
    })

    it('should have ACTIVE_SCALE', () => {
      expect(ANIMATIONS.ACTIVE_SCALE).toBe(0.9)
    })
  })

  describe('STORAGE_KEYS', () => {
    it('should have AUTH_TOKEN key', () => {
      expect(STORAGE_KEYS.AUTH_TOKEN).toBe('auth-token')
    })

    it('should have AUTH_STORAGE key', () => {
      expect(STORAGE_KEYS.AUTH_STORAGE).toBe('auth-storage')
    })

    it('should have THEME key', () => {
      expect(STORAGE_KEYS.THEME).toBe('theme')
    })

    it('should have LANGUAGE key', () => {
      expect(STORAGE_KEYS.LANGUAGE).toBe('language')
    })
  })

  describe('API', () => {
    it('should have BASE_URL', () => {
      expect(API.BASE_URL).toBeDefined()
      expect(typeof API.BASE_URL).toBe('string')
    })

    it('should have TIMEOUT', () => {
      expect(API.TIMEOUT).toBe(10000)
    })

    it('should have RETRY_ATTEMPTS', () => {
      expect(API.RETRY_ATTEMPTS).toBe(3)
    })
  })

  describe('ERROR_MESSAGES', () => {
    it('should have NETWORK_ERROR message', () => {
      expect(ERROR_MESSAGES.NETWORK_ERROR).toContain('网络')
    })

    it('should have AUTH_REQUIRED message', () => {
      expect(ERROR_MESSAGES.AUTH_REQUIRED).toContain('登录')
    })

    it('should have PERMISSION_DENIED message', () => {
      expect(ERROR_MESSAGES.PERMISSION_DENIED).toContain('权限')
    })

    it('should have UNKNOWN_ERROR message', () => {
      expect(ERROR_MESSAGES.UNKNOWN_ERROR).toContain('错误')
    })
  })

  describe('SUCCESS_MESSAGES', () => {
    it('should have SAVE_SUCCESS message', () => {
      expect(SUCCESS_MESSAGES.SAVE_SUCCESS).toBe('保存成功')
    })

    it('should have DELETE_SUCCESS message', () => {
      expect(SUCCESS_MESSAGES.DELETE_SUCCESS).toBe('删除成功')
    })

    it('should have UPDATE_SUCCESS message', () => {
      expect(SUCCESS_MESSAGES.UPDATE_SUCCESS).toBe('更新成功')
    })

    it('should have LOGIN_SUCCESS message', () => {
      expect(SUCCESS_MESSAGES.LOGIN_SUCCESS).toBe('登录成功')
    })

    it('should have LOGOUT_SUCCESS message', () => {
      expect(SUCCESS_MESSAGES.LOGOUT_SUCCESS).toBe('退出成功')
    })
  })

  describe('UPYUN_CDN_URL', () => {
    it('should be a non-empty string', () => {
      expect(typeof UPYUN_CDN_URL).toBe('string')
      expect(UPYUN_CDN_URL.length).toBeGreaterThan(0)
    })
  })

  describe('FOOTER_BG_IMAGES_LIGHT', () => {
    it('should be an array of strings', () => {
      expect(Array.isArray(FOOTER_BG_IMAGES_LIGHT)).toBe(true)
      expect(FOOTER_BG_IMAGES_LIGHT.length).toBeGreaterThan(0)
    })

    it('should have image filenames', () => {
      FOOTER_BG_IMAGES_LIGHT.forEach(filename => {
        expect(typeof filename).toBe('string')
        expect(filename).toMatch(/\.png$/)
      })
    })
  })
})
