import { describe, expect, it } from 'vitest'
import { API_ENDPOINTS, VALIDATION, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants'

describe('categories constants', () => {
  describe('API_ENDPOINTS', () => {
    it('has correct categories endpoint', () => {
      expect(API_ENDPOINTS.CATEGORIES).toBe('/things/categories')
    })

    it('has correct uncategorized items endpoint', () => {
      expect(API_ENDPOINTS.UNCATEGORIZED_ITEMS).toBe('/things/items?uncategorized=true&own=true')
    })
  })

  describe('VALIDATION', () => {
    it('has correct max length', () => {
      expect(VALIDATION.CATEGORY_NAME_MAX_LENGTH).toBe(50)
    })

    it('has correct min length', () => {
      expect(VALIDATION.CATEGORY_NAME_MIN_LENGTH).toBe(1)
    })

    it('min is less than max', () => {
      expect(VALIDATION.CATEGORY_NAME_MIN_LENGTH).toBeLessThan(VALIDATION.CATEGORY_NAME_MAX_LENGTH)
    })
  })

  describe('ERROR_MESSAGES', () => {
    it('has empty name error message', () => {
      expect(ERROR_MESSAGES.CATEGORY_NAME_EMPTY).toBe('分类名称不能为空')
    })

    it('has too long error message with max length', () => {
      expect(ERROR_MESSAGES.CATEGORY_NAME_TOO_LONG).toContain('50')
    })

    it('has update failed message', () => {
      expect(ERROR_MESSAGES.UPDATE_FAILED).toBe('更新失败，请重试')
    })

    it('has delete failed message', () => {
      expect(ERROR_MESSAGES.DELETE_FAILED).toBe('删除失败，请重试')
    })

    it('has create failed message', () => {
      expect(ERROR_MESSAGES.CREATE_FAILED).toBe('创建失败，请重试')
    })
  })

  describe('SUCCESS_MESSAGES', () => {
    it('has created success message', () => {
      expect(SUCCESS_MESSAGES.CATEGORY_CREATED).toBe('分类创建成功')
    })

    it('has updated success message', () => {
      expect(SUCCESS_MESSAGES.CATEGORY_UPDATED).toBe('分类更新成功')
    })

    it('has deleted success message', () => {
      expect(SUCCESS_MESSAGES.CATEGORY_DELETED).toBe('分类删除成功')
    })
  })
})
