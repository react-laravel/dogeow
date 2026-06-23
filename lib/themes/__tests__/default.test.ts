import { describe, it, expect } from 'vitest'
import { defaultTheme } from '../default'
import type { UITheme } from '../types'

describe('default theme', () => {
  it('should have correct id and name', () => {
    expect(defaultTheme.id).toBe('default')
    expect(defaultTheme.name).toBe('默认主题')
  })

  it('should have version', () => {
    expect(defaultTheme.version).toBe('1.0.0')
  })

  it('should have description', () => {
    expect(defaultTheme.description).toBe('基于当前设计的默认 UI 主题')
  })

  it('should have header configuration', () => {
    expect(defaultTheme.layout.header).toBeDefined()
    expect(defaultTheme.layout.header.height).toBe('50px')
    expect(defaultTheme.layout.header.position).toBe('sticky')
    expect(defaultTheme.layout.header.showLogo).toBe(true)
    expect(defaultTheme.layout.header.showNavigation).toBe(true)
    expect(defaultTheme.layout.header.showSearch).toBe(true)
    expect(defaultTheme.layout.header.showUserMenu).toBe(true)
  })

  it('should have header component path', () => {
    expect(defaultTheme.layout.header.component).toBe('themes/default/Header')
  })

  it('should have main layout configuration', () => {
    expect(defaultTheme.layout.main).toBeDefined()
    expect(defaultTheme.layout.main.maxWidth).toBe('1280px')
    expect(defaultTheme.layout.main.padding).toBe('0')
    expect(defaultTheme.layout.main.containerType).toBe('centered')
  })

  it('should not have sidebar or footer in layout', () => {
    expect((defaultTheme.layout as Record<string, unknown>).sidebar).toBeUndefined()
    expect((defaultTheme.layout as Record<string, unknown>).footer).toBeUndefined()
  })

  it('should have CSS variables', () => {
    expect(defaultTheme.styles.cssVariables).toBeDefined()
    expect(defaultTheme.styles.cssVariables['--app-header-height']).toBe('50px')
  })

  it('should have component variants', () => {
    expect(defaultTheme.styles.componentVariants).toBeDefined()
    expect(defaultTheme.styles.componentVariants.card).toBe('default')
    expect(defaultTheme.styles.componentVariants.button).toBe('default')
    expect(defaultTheme.styles.componentVariants.input).toBe('default')
    expect(defaultTheme.styles.componentVariants.tile).toBe('default')
  })

  it('should have component mappings', () => {
    expect(defaultTheme.components).toBeDefined()
    expect(defaultTheme.components.TileCard).toBe('components/app/TileCard')
    expect(defaultTheme.components.AppLauncher).toBe('components/launcher')
  })

  it('should have metadata with tags', () => {
    expect(defaultTheme.metadata).toBeDefined()
    expect(defaultTheme.metadata.tags).toContain('default')
    expect(defaultTheme.metadata.tags).toContain('classic')
  })

  it('should conform to UITheme interface', () => {
    const theme: UITheme = defaultTheme
    expect(theme.id).toBeDefined()
    expect(theme.name).toBeDefined()
    expect(theme.layout).toBeDefined()
    expect(theme.styles).toBeDefined()
  })
})
