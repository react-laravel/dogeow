import { describe, it, expect } from 'vitest'
import { translations, SUPPORTED_LANGUAGES } from '../translations'

describe('translations', () => {
  describe('translations object', () => {
    it('should have entries for all supported languages', () => {
      for (const lang of SUPPORTED_LANGUAGES) {
        expect(translations[lang.code]).toBeDefined()
        expect(typeof translations[lang.code]).toBe('object')
      }
    })

    it('should have zh-CN translations', () => {
      expect(translations['zh-CN']).toBeDefined()
      expect(translations['zh-CN']['nav.thing']).toBeDefined()
    })

    it('should have en translations', () => {
      expect(translations['en']).toBeDefined()
      expect(translations['en']['nav.thing']).toBe('Things')
    })

    it('should have ja translations', () => {
      expect(translations['ja']).toBeDefined()
    })

    it('should have zh-TW translations', () => {
      expect(translations['zh-TW']).toBeDefined()
    })

    it('should have common keys in English translations', () => {
      expect(translations['en']['common.save']).toBe('Save')
      expect(translations['en']['common.cancel']).toBe('Cancel')
      expect(translations['en']['common.delete']).toBe('Delete')
      expect(translations['en']['common.edit']).toBe('Edit')
      expect(translations['en']['common.add']).toBe('Add')
    })

    it('should have navigation keys in English translations', () => {
      expect(translations['en']['nav.thing']).toBe('Things')
      expect(translations['en']['nav.file']).toBe('Files')
      expect(translations['en']['nav.note']).toBe('Notes')
      expect(translations['en']['nav.chat']).toBe('Chat')
      expect(translations['en']['nav.game']).toBe('Games')
    })

    it('should have game keys in English translations', () => {
      expect(translations['en']['game.2048']).toBe('2048')
      expect(translations['en']['game.tetris']).toBe('Tetris')
      expect(translations['en']['game.snake']).toBe('Snake')
    })

    it('should have app title in English', () => {
      expect(translations['en']['app.title']).toBe('DogeOw')
    })

    it('should have settings keys in English', () => {
      expect(translations['en']['settings.language']).toBe('Language')
      expect(translations['en']['settings.theme']).toBe('Theme')
    })
  })

  describe('SUPPORTED_LANGUAGES', () => {
    it('should have 4 supported languages', () => {
      expect(SUPPORTED_LANGUAGES).toHaveLength(4)
    })

    it('should include zh-CN', () => {
      const zhCN = SUPPORTED_LANGUAGES.find(l => l.code === 'zh-CN')
      expect(zhCN).toBeDefined()
      expect(zhCN?.name).toBe('Chinese (Simplified)')
      expect(zhCN?.nativeName).toBe('简体中文')
    })

    it('should include zh-TW', () => {
      const zhTW = SUPPORTED_LANGUAGES.find(l => l.code === 'zh-TW')
      expect(zhTW).toBeDefined()
      expect(zhTW?.name).toBe('Chinese (Traditional)')
      expect(zhTW?.nativeName).toBe('繁體中文')
    })

    it('should include en', () => {
      const en = SUPPORTED_LANGUAGES.find(l => l.code === 'en')
      expect(en).toBeDefined()
      expect(en?.name).toBe('English')
      expect(en?.nativeName).toBe('English')
    })

    it('should include ja', () => {
      const ja = SUPPORTED_LANGUAGES.find(l => l.code === 'ja')
      expect(ja).toBeDefined()
      expect(ja?.name).toBe('Japanese')
      expect(ja?.nativeName).toBe('日本語')
    })

    it('should have code, name, and nativeName for each language', () => {
      for (const lang of SUPPORTED_LANGUAGES) {
        expect(lang.code).toBeDefined()
        expect(lang.name).toBeDefined()
        expect(lang.nativeName).toBeDefined()
        expect(typeof lang.code).toBe('string')
        expect(typeof lang.name).toBe('string')
        expect(typeof lang.nativeName).toBe('string')
      }
    })
  })
})
