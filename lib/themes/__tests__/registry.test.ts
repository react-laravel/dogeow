import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  registerTheme,
  getTheme,
  getAllThemes,
  getThemeList,
  hasTheme,
  unregisterTheme,
} from '../registry'
import type { UITheme } from '../types'

const TEST_IDS: string[] = []

const makeTheme = (overrides: Partial<UITheme> = {}): UITheme => ({
  id: overrides.id || `test-theme-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: 'Test Theme',
  description: 'A test theme',
  version: '1.0.0',
  layout: {
    header: {
      component: 'themes/test/Header',
      height: '50px',
      position: 'sticky',
      showLogo: true,
      showNavigation: true,
      showSearch: true,
      showUserMenu: true,
    },
    main: {
      maxWidth: '1280px',
      padding: '0',
      containerType: 'centered',
    },
  },
  styles: {
    componentVariants: {
      card: 'default',
      button: 'default',
      input: 'default',
      tile: 'default',
    },
  },
  ...overrides,
})

describe('theme registry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up all test themes
    for (const id of TEST_IDS.splice(0)) {
      try {
        unregisterTheme(id)
      } catch {
        // ignore cleanup errors
      }
    }
  })

  function registerTestTheme(overrides: Partial<UITheme> = {}): UITheme {
    const theme = makeTheme(overrides)
    TEST_IDS.push(theme.id)
    registerTheme(theme)
    return theme
  }

  describe('registerTheme', () => {
    it('should register a new theme', () => {
      const theme = registerTestTheme({ id: 'register-test-1', name: 'Register Test' })
      expect(hasTheme(theme.id)).toBe(true)
    })

    it('should warn when overwriting an existing theme', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const theme1 = registerTestTheme({ id: 'overlap-theme', name: 'Original' })
      const theme2 = makeTheme({ id: 'overlap-theme', name: 'Updated' })

      registerTheme(theme2)

      expect(consoleSpy).toHaveBeenCalledWith('主题 overlap-theme 已存在，将被覆盖')
      expect(getTheme('overlap-theme')?.name).toBe('Updated')

      consoleSpy.mockRestore()
    })
  })

  describe('getTheme', () => {
    it('should return the registered theme by id', () => {
      const theme = registerTestTheme({ id: 'findable-theme', name: 'Findable' })
      const found = getTheme('findable-theme')
      expect(found).toBeDefined()
      expect(found?.id).toBe('findable-theme')
      expect(found?.name).toBe('Findable')
    })

    it('should return undefined for unknown theme id', () => {
      expect(getTheme('nonexistent-theme-xyz')).toBeUndefined()
    })
  })

  describe('getAllThemes', () => {
    it('should include built-in themes', () => {
      const all = getAllThemes()
      expect(all['default']).toBeDefined()
      expect(all['sidebar']).toBeDefined()
      expect(all['minimal']).toBeDefined()
      expect(all['dashboard']).toBeDefined()
    })
  })

  describe('getThemeList', () => {
    it('should return array of theme metadata', () => {
      const theme = registerTestTheme({
        id: 'list-theme',
        name: 'List Theme',
        description: 'A theme for list testing',
      })

      const list = getThemeList()
      const found = list.find(t => t.id === 'list-theme')
      expect(found).toBeDefined()
      expect(found?.name).toBe('List Theme')
      expect(found?.description).toBe('A theme for list testing')
    })

    it('should include built-in themes', () => {
      const list = getThemeList()
      const ids = list.map(t => t.id)
      expect(ids).toContain('default')
      expect(ids).toContain('sidebar')
      expect(ids).toContain('minimal')
      expect(ids).toContain('dashboard')
    })
  })

  describe('hasTheme', () => {
    it('should return true for registered themes', () => {
      const theme = registerTestTheme({ id: 'exists-theme' })
      expect(hasTheme(theme.id)).toBe(true)
    })

    it('should return false for unregistered themes', () => {
      expect(hasTheme('does-not-exist-xyz')).toBe(false)
    })
  })

  describe('unregisterTheme', () => {
    it('should remove a registered theme', () => {
      const theme = registerTestTheme({ id: 'removable-theme' })
      expect(hasTheme(theme.id)).toBe(true)

      unregisterTheme(theme.id)
      expect(hasTheme(theme.id)).toBe(false)
    })

    it('should warn and not remove the default theme', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      unregisterTheme('default')
      expect(hasTheme('default')).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith('不能删除默认主题')

      consoleSpy.mockRestore()
    })
  })
})
