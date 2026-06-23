import { describe, it, expect } from 'vitest'
import { minimalTheme } from '../minimal'
import type { UITheme } from '../types'

describe('minimal theme', () => {
  it('should have correct id and name', () => {
    expect(minimalTheme.id).toBe('minimal')
    expect(minimalTheme.name).toBe('极简主题')
  })

  it('should have version', () => {
    expect(minimalTheme.version).toBe('1.0.0')
  })

  it('should have description', () => {
    expect(minimalTheme.description).toBe('极简主义设计，去除多余元素，专注内容')
  })

  it('should have header configuration', () => {
    expect(minimalTheme.layout.header).toBeDefined()
    expect(minimalTheme.layout.header.height).toBe('48px')
    expect(minimalTheme.layout.header.position).toBe('sticky')
    expect(minimalTheme.layout.header.showLogo).toBe(true)
    expect(minimalTheme.layout.header.showNavigation).toBe(false)
    expect(minimalTheme.layout.header.showSearch).toBe(false)
    expect(minimalTheme.layout.header.showUserMenu).toBe(true)
  })

  it('should have header component path', () => {
    expect(minimalTheme.layout.header.component).toBe('themes/minimal/Header')
  })

  it('should have main layout configuration', () => {
    expect(minimalTheme.layout.main).toBeDefined()
    expect(minimalTheme.layout.main.maxWidth).toBe('1200px')
    expect(minimalTheme.layout.main.padding).toBe('3rem 2rem')
    expect(minimalTheme.layout.main.containerType).toBe('centered')
  })

  it('should not have sidebar or footer in layout', () => {
    expect((minimalTheme.layout as Record<string, unknown>).sidebar).toBeUndefined()
    expect((minimalTheme.layout as Record<string, unknown>).footer).toBeUndefined()
  })

  it('should have CSS variables', () => {
    expect(minimalTheme.styles.cssVariables).toBeDefined()
    expect(minimalTheme.styles.cssVariables['--app-header-height']).toBe('48px')
  })

  it('should have minimal component variants', () => {
    expect(minimalTheme.styles.componentVariants).toBeDefined()
    expect(minimalTheme.styles.componentVariants.card).toBe('minimal')
    expect(minimalTheme.styles.componentVariants.button).toBe('minimal')
    expect(minimalTheme.styles.componentVariants.input).toBe('minimal')
    expect(minimalTheme.styles.componentVariants.tile).toBe('minimal')
  })

  it('should have component mappings', () => {
    expect(minimalTheme.components).toBeDefined()
    expect(minimalTheme.components.TileCard).toBe('themes/minimal/TileCard')
  })

  it('should have metadata with tags', () => {
    expect(minimalTheme.metadata).toBeDefined()
    expect(minimalTheme.metadata.tags).toContain('minimal')
    expect(minimalTheme.metadata.tags).toContain('clean')
    expect(minimalTheme.metadata.tags).toContain('simple')
  })

  it('should be different from default theme', () => {
    expect(minimalTheme.id).not.toBe('default')
    expect(minimalTheme.layout.header.height).not.toBe('50px')
    expect(minimalTheme.layout.header.showNavigation).toBe(false)
    expect(minimalTheme.layout.header.showSearch).toBe(false)
  })

  it('should conform to UITheme interface', () => {
    const theme: UITheme = minimalTheme
    expect(theme.id).toBeDefined()
    expect(theme.name).toBeDefined()
    expect(theme.layout).toBeDefined()
    expect(theme.styles).toBeDefined()
  })
})
