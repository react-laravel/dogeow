import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useThemeColors } from '../useThemeColors'

// Mock next-themes
const mockUseThemeFn = vi.fn(() => ({
  theme: 'light',
  systemTheme: 'light',
}))

vi.mock('next-themes', () => ({
  useTheme: () => mockUseThemeFn(),
}))

describe('useThemeColors', () => {
  // Get the original contains method from the prototype to avoid override pollution
  const originalContainsMethod = DOMTokenList.prototype.contains

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock to default
    mockUseThemeFn.mockReturnValue({ theme: 'light', systemTheme: 'light' })
    // Fully restore classList.contains to original implementation
    document.documentElement.classList.contains = originalContainsMethod.bind(
      document.documentElement.classList
    )
    // Remove dark class
    document.documentElement.classList.remove('dark')
  })

  it('should initialize with light fallback and isDark false', async () => {
    mockUseThemeFn.mockReturnValue({ theme: 'light', systemTheme: 'light' })

    const { result } = renderHook(() => useThemeColors())

    await waitFor(() => {
      expect(result.current.isDark).toBe(false)
    })
    expect(result.current.themeColors.background).toBe('#ffffff')
  })

  it('should update to dark mode when theme is dark', async () => {
    mockUseThemeFn.mockReturnValue({ theme: 'dark', systemTheme: 'dark' })

    const { result } = renderHook(() => useThemeColors())

    await waitFor(() => {
      expect(result.current.isDark).toBe(true)
      expect(result.current.themeColors.background).toBe('#0b0b0b')
    })
  })

  it('should update to dark mode when system theme is dark', async () => {
    mockUseThemeFn.mockReturnValue({ theme: 'system', systemTheme: 'dark' })

    // Override classList.contains before rendering
    document.documentElement.classList.contains = (className: string) => {
      return className === 'dark' ? true : originalContainsMethod(className)
    }

    const { result } = renderHook(() => useThemeColors())

    try {
      await waitFor(() => {
        expect(result.current.isDark).toBe(true)
      })
    } finally {
      document.documentElement.classList.contains = originalContainsMethod
    }
  })

  it('should stay in light mode when system theme is light', async () => {
    mockUseThemeFn.mockReturnValue({ theme: 'system', systemTheme: 'light' })

    document.documentElement.classList.contains = (className: string) => {
      return className === 'dark' ? false : originalContainsMethod(className)
    }

    try {
      const { result } = renderHook(() => useThemeColors())

      await waitFor(() => {
        expect(result.current.isDark).toBe(false)
      })
    } finally {
      document.documentElement.classList.contains = originalContainsMethod
    }
  })

  it('should stay in light mode when theme is explicitly light', async () => {
    mockUseThemeFn.mockReturnValue({ theme: 'light', systemTheme: 'light' })

    // Light theme without dark class should stay light
    document.documentElement.classList.contains = (className: string) => {
      return className === 'dark' ? false : originalContainsMethod(className)
    }

    try {
      const { result } = renderHook(() => useThemeColors())

      await waitFor(() => {
        expect(result.current.isDark).toBe(false)
      })
    } finally {
      document.documentElement.classList.contains = originalContainsMethod
    }
  })

  it('should read CSS custom properties from document', async () => {
    mockUseThemeFn.mockReturnValue({ theme: 'light', systemTheme: 'light' })

    const mockStyles = {
      getPropertyValue: vi.fn((name: string) => {
        const props: Record<string, string> = {
          '--background': '#custom-bg',
          '--foreground': '#custom-fg',
          '--card': '#custom-card',
          '--card-foreground': '#custom-card-fg',
          '--muted-foreground': '#custom-muted',
          '--border': '#custom-border',
          '--primary': '#custom-primary',
          '--ring': '#custom-ring',
          '--accent': '#custom-accent',
        }
        return props[name] || ''
      }),
    }
    const originalGetComputedStyle = window.getComputedStyle
    window.getComputedStyle = vi.fn(() => mockStyles as unknown as CSSStyleDeclaration)

    try {
      const { result } = renderHook(() => useThemeColors())

      await waitFor(() => {
        expect(result.current.themeColors.background).toBe('#custom-bg')
        expect(result.current.themeColors.primary).toBe('#custom-primary')
      })
    } finally {
      window.getComputedStyle = originalGetComputedStyle
    }
  })

  it('should fall back to light fallback when CSS properties are empty', async () => {
    mockUseThemeFn.mockReturnValue({ theme: 'light', systemTheme: 'light' })

    const mockStyles = {
      getPropertyValue: vi.fn().mockReturnValue(''),
    }
    const originalGetComputedStyle = window.getComputedStyle
    window.getComputedStyle = vi.fn(() => mockStyles as unknown as CSSStyleDeclaration)

    try {
      const { result } = renderHook(() => useThemeColors())

      await waitFor(() => {
        expect(result.current.themeColors.background).toBe('#ffffff')
      })
    } finally {
      window.getComputedStyle = originalGetComputedStyle
    }
  })

  it('should return theme colors with correct shape', async () => {
    mockUseThemeFn.mockReturnValue({ theme: 'light', systemTheme: 'light' })

    const { result } = renderHook(() => useThemeColors())

    await waitFor(() => {
      expect(result.current.themeColors).toHaveProperty('background')
      expect(result.current.themeColors).toHaveProperty('foreground')
      expect(result.current.themeColors).toHaveProperty('card')
      expect(result.current.themeColors).toHaveProperty('cardForeground')
      expect(result.current.themeColors).toHaveProperty('mutedForeground')
      expect(result.current.themeColors).toHaveProperty('border')
      expect(result.current.themeColors).toHaveProperty('primary')
      expect(result.current.themeColors).toHaveProperty('ring')
      expect(result.current.themeColors).toHaveProperty('accent')
    })
  })

  it('should update when theme changes', async () => {
    mockUseThemeFn.mockReturnValue({ theme: 'light', systemTheme: 'light' })

    document.documentElement.classList.contains = (className: string) => {
      return className === 'dark' ? false : originalContainsMethod(className)
    }

    try {
      const { result, rerender } = renderHook(() => useThemeColors())

      await waitFor(() => {
        expect(result.current.isDark).toBe(false)
      })

      mockUseThemeFn.mockReturnValue({ theme: 'dark', systemTheme: 'dark' })
      document.documentElement.classList.contains = (className: string) => {
        return className === 'dark' ? true : originalContainsMethod(className)
      }
      rerender()

      await waitFor(() => {
        expect(result.current.isDark).toBe(true)
      })
    } finally {
      document.documentElement.classList.contains = originalContainsMethod
    }
  })
})
