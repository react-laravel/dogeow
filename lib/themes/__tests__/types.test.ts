import { describe, it, expect } from 'vitest'
import type { UITheme, ThemeRegistry, ThemeSwitchOptions } from '../types'

describe('theme types', () => {
  describe('UITheme interface', () => {
    it('should require id and name', () => {
      const theme: UITheme = {
        id: 'test',
        name: 'Test',
        layout: {
          header: {
            component: '',
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
          componentVariants: {},
        },
      }
      expect(theme.id).toBe('test')
      expect(theme.name).toBe('Test')
    })

    it('should allow optional description', () => {
      const theme: UITheme = {
        id: 'test',
        name: 'Test',
        layout: {
          header: {
            component: '',
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
          componentVariants: {},
        },
      }
      expect(theme.description).toBeUndefined()
    })

    it('should allow optional version', () => {
      const theme: UITheme = {
        id: 'test',
        name: 'Test',
        version: '2.0.0',
        layout: {
          header: {
            component: '',
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
          componentVariants: {},
        },
      }
      expect(theme.version).toBe('2.0.0')
    })

    it('should allow optional author', () => {
      const theme: UITheme = {
        id: 'test',
        name: 'Test',
        author: 'Test Author',
        layout: {
          header: {
            component: '',
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
          componentVariants: {},
        },
      }
      expect(theme.author).toBe('Test Author')
    })

    it('should support optional sidebar configuration', () => {
      const theme: UITheme = {
        id: 'sidebar-theme',
        name: 'Sidebar Theme',
        layout: {
          header: {
            component: '',
            height: '60px',
            position: 'fixed',
            showLogo: true,
            showNavigation: false,
            showSearch: true,
            showUserMenu: true,
          },
          sidebar: {
            component: 'themes/sidebar/Sidebar',
            position: 'left',
            width: '240px',
            collapsible: true,
            defaultCollapsed: false,
          },
          main: {
            maxWidth: '100%',
            padding: '1.5rem',
            containerType: 'sidebar',
          },
        },
        styles: {
          componentVariants: {},
        },
      }
      expect(theme.layout.sidebar).toBeDefined()
      expect(theme.layout.sidebar?.position).toBe('left')
      expect(theme.layout.sidebar?.width).toBe('240px')
      expect(theme.layout.sidebar?.collapsible).toBe(true)
      expect(theme.layout.sidebar?.defaultCollapsed).toBe(false)
    })

    it('should support optional footer configuration', () => {
      const theme: UITheme = {
        id: 'footer-theme',
        name: 'Footer Theme',
        layout: {
          header: {
            component: '',
            height: '50px',
            position: 'sticky',
            showLogo: true,
            showNavigation: true,
            showSearch: true,
            showUserMenu: true,
          },
          footer: {
            component: 'themes/footer/Footer',
            show: true,
            height: '40px',
          },
          main: {
            maxWidth: '1280px',
            padding: '0',
            containerType: 'centered',
          },
        },
        styles: {
          componentVariants: {},
        },
      }
      expect(theme.layout.footer).toBeDefined()
      expect(theme.layout.footer?.show).toBe(true)
      expect(theme.layout.footer?.height).toBe('40px')
    })

    it('should support header position options', () => {
      const positions: UITheme['layout']['header']['position'][] = ['sticky', 'fixed', 'static']
      positions.forEach(position => {
        const theme: UITheme = {
          id: `pos-${position}`,
          name: `Position ${position}`,
          layout: {
            header: {
              component: '',
              height: '50px',
              position,
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
            componentVariants: {},
          },
        }
        expect(theme.layout.header.position).toBe(position)
      })
    })

    it('should support main containerType options', () => {
      const types: UITheme['layout']['main']['containerType'][] = ['full', 'centered', 'sidebar']
      types.forEach(containerType => {
        const theme: UITheme = {
          id: `ct-${containerType}`,
          name: `Container ${containerType}`,
          layout: {
            header: {
              component: '',
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
              containerType,
            },
          },
          styles: {
            componentVariants: {},
          },
        }
        expect(theme.layout.main.containerType).toBe(containerType)
      })
    })

    it('should support optional CSS variables', () => {
      const theme: UITheme = {
        id: 'css-test',
        name: 'CSS Test',
        layout: {
          header: {
            component: '',
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
          cssVariables: {
            '--custom-color': '#ff0000',
            '--custom-spacing': '16px',
          },
          componentVariants: {},
        },
      }
      expect(theme.styles.cssVariables).toBeDefined()
      expect(theme.styles.cssVariables!['--custom-color']).toBe('#ff0000')
    })

    it('should support component variants', () => {
      const theme: UITheme = {
        id: 'variants-test',
        name: 'Variants Test',
        layout: {
          header: {
            component: '',
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
            card: 'glass',
            button: 'rounded',
            input: 'outlined',
            tile: 'large',
          },
        },
      }
      expect(theme.styles.componentVariants.card).toBe('glass')
      expect(theme.styles.componentVariants.button).toBe('rounded')
      expect(theme.styles.componentVariants.input).toBe('outlined')
      expect(theme.styles.componentVariants.tile).toBe('large')
    })

    it('should support optional components mapping', () => {
      const theme: UITheme = {
        id: 'components-test',
        name: 'Components Test',
        layout: {
          header: {
            component: '',
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
          componentVariants: {},
        },
        components: {
          TileCard: 'custom/TileCard',
          Navigation: 'custom/Navigation',
        },
      }
      expect(theme.components?.TileCard).toBe('custom/TileCard')
      expect(theme.components?.Navigation).toBe('custom/Navigation')
    })

    it('should support optional metadata', () => {
      const theme: UITheme = {
        id: 'meta-test',
        name: 'Meta Test',
        layout: {
          header: {
            component: '',
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
          componentVariants: {},
        },
        metadata: {
          tags: ['tag1', 'tag2'],
          compatible: ['default', 'sidebar'],
        },
      }
      expect(theme.metadata?.tags).toEqual(['tag1', 'tag2'])
      expect(theme.metadata?.compatible).toEqual(['default', 'sidebar'])
    })
  })

  describe('ThemeRegistry type', () => {
    it('should be a record of theme id to UITheme', () => {
      const registry: ThemeRegistry = {
        'theme-a': {
          id: 'theme-a',
          name: 'A',
          layout: {
            header: {
              component: '',
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
          styles: { componentVariants: {} },
        },
      }
      expect(registry['theme-a'].id).toBe('theme-a')
    })
  })

  describe('ThemeSwitchOptions type', () => {
    it('should support optional preserveState', () => {
      const opts: ThemeSwitchOptions = { preserveState: true }
      expect(opts.preserveState).toBe(true)
    })

    it('should support optional animate', () => {
      const opts: ThemeSwitchOptions = { animate: true }
      expect(opts.animate).toBe(true)
    })

    it('should support optional reload', () => {
      const opts: ThemeSwitchOptions = { reload: true }
      expect(opts.reload).toBe(true)
    })

    it('should allow all options', () => {
      const opts: ThemeSwitchOptions = {
        preserveState: true,
        animate: true,
        reload: false,
      }
      expect(opts).toEqual({
        preserveState: true,
        animate: true,
        reload: false,
      })
    })
  })
})
