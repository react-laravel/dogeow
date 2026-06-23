import { describe, it, expect } from 'vitest'
import { sidebarTheme } from '../sidebar'
import type { UITheme } from '../types'

describe('sidebar theme', () => {
  it('should have correct id and name', () => {
    expect(sidebarTheme.id).toBe('sidebar')
    expect(sidebarTheme.name).toBe('侧边栏布局')
  })

  it('should have version', () => {
    expect(sidebarTheme.version).toBe('1.0.0')
  })

  it('should have description', () => {
    expect(sidebarTheme.description).toBe('带左侧边栏的经典布局，类似管理后台')
  })

  it('should have header configuration', () => {
    expect(sidebarTheme.layout.header).toBeDefined()
    expect(sidebarTheme.layout.header.height).toBe('60px')
    expect(sidebarTheme.layout.header.position).toBe('fixed')
    expect(sidebarTheme.layout.header.showLogo).toBe(true)
    expect(sidebarTheme.layout.header.showNavigation).toBe(false)
    expect(sidebarTheme.layout.header.showSearch).toBe(true)
    expect(sidebarTheme.layout.header.showUserMenu).toBe(true)
  })

  it('should have sidebar configuration', () => {
    expect(sidebarTheme.layout.sidebar).toBeDefined()
    expect(sidebarTheme.layout.sidebar.position).toBe('left')
    expect(sidebarTheme.layout.sidebar.width).toBe('240px')
    expect(sidebarTheme.layout.sidebar.collapsible).toBe(true)
    expect(sidebarTheme.layout.sidebar.defaultCollapsed).toBe(false)
  })

  it('should have sidebar component path', () => {
    expect(sidebarTheme.layout.sidebar?.component).toBe('themes/sidebar/Sidebar')
  })

  it('should have main layout configuration', () => {
    expect(sidebarTheme.layout.main).toBeDefined()
    expect(sidebarTheme.layout.main.maxWidth).toBe('100%')
    expect(sidebarTheme.layout.main.padding).toBe('1.5rem')
    expect(sidebarTheme.layout.main.containerType).toBe('sidebar')
  })

  it('should not have footer in layout', () => {
    expect((sidebarTheme.layout as Record<string, unknown>).footer).toBeUndefined()
  })

  it('should have CSS variables including sidebar width', () => {
    expect(sidebarTheme.styles.cssVariables).toBeDefined()
    expect(sidebarTheme.styles.cssVariables['--app-header-height']).toBe('60px')
    expect(sidebarTheme.styles.cssVariables['--sidebar-width']).toBe('240px')
  })

  it('should have sidebar-style component variants', () => {
    expect(sidebarTheme.styles.componentVariants).toBeDefined()
    expect(sidebarTheme.styles.componentVariants.card).toBe('bordered')
    expect(sidebarTheme.styles.componentVariants.button).toBe('minimal')
    expect(sidebarTheme.styles.componentVariants.input).toBe('outlined')
    expect(sidebarTheme.styles.componentVariants.tile).toBe('compact')
  })

  it('should have component mappings', () => {
    expect(sidebarTheme.components).toBeDefined()
    expect(sidebarTheme.components.TileCard).toBe('themes/sidebar/TileCard')
  })

  it('should have metadata with tags', () => {
    expect(sidebarTheme.metadata).toBeDefined()
    expect(sidebarTheme.metadata.tags).toContain('sidebar')
    expect(sidebarTheme.metadata.tags).toContain('admin')
    expect(sidebarTheme.metadata.tags).toContain('classic')
  })

  it('should be different from default theme', () => {
    expect(sidebarTheme.id).not.toBe('default')
    expect(sidebarTheme.layout.header.height).not.toBe('50px')
    expect(sidebarTheme.layout.sidebar).toBeDefined()
  })

  it('should conform to UITheme interface', () => {
    const theme: UITheme = sidebarTheme
    expect(theme.id).toBeDefined()
    expect(theme.name).toBeDefined()
    expect(theme.layout).toBeDefined()
    expect(theme.layout.sidebar).toBeDefined()
    expect(theme.styles).toBeDefined()
  })
})
