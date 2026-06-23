import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGraphPalette } from '../useGraphPalette'

// Define mock values using hoisted pattern to avoid initialization issues
const { mockWithAlpha, mockLightFallback, mockDarkFallback } = vi.hoisted(() => ({
  mockWithAlpha: vi.fn((color: string, alpha: number, fallback: string) => {
    const trimmed = color.trim()
    if (!trimmed) return fallback
    const rgbaMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
    if (rgbaMatch) {
      return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${alpha})`
    }
    const hexMatch = trimmed.match(/^#([0-9a-f]+)$/i)
    if (hexMatch) {
      const hex = hexMatch[1]
      const isShort = hex.length <= 3
      const normalize = (v: string) => (isShort ? parseInt(v + v, 16) : parseInt(v, 16))
      if (isShort) {
        const r = normalize(hex.slice(0, 1))
        const g = normalize(hex.slice(1, 2))
        const b = normalize(hex.slice(2, 3))
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      }
      const r = normalize(hex.slice(0, 2))
      const g = normalize(hex.slice(2, 4))
      const b = normalize(hex.slice(4, 6))
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    return fallback
  }),
  mockLightFallback: {
    background: '#ffffff',
    foreground: '#111827',
    card: '#ffffff',
    cardForeground: '#111827',
    mutedForeground: '#64748b',
    border: '#e5e7eb',
    primary: '#2563eb',
    ring: '#60a5fa',
    accent: '#38bdf8',
  },
  mockDarkFallback: {
    background: '#0b0b0b',
    foreground: '#f8fafc',
    card: '#111827',
    cardForeground: '#f8fafc',
    mutedForeground: '#94a3b8',
    border: '#1f2937',
    primary: '#60a5fa',
    ring: '#38bdf8',
    accent: '#22d3ee',
  },
}))

vi.mock('../../utils/themeUtils', () => ({
  withAlpha: mockWithAlpha,
  LIGHT_FALLBACK: mockLightFallback,
  DARK_FALLBACK: mockDarkFallback,
}))

const createThemeColors = (overrides: Record<string, string> = {}): Record<string, string> => ({
  background: '#ffffff',
  foreground: '#111827',
  card: '#ffffff',
  cardForeground: '#111827',
  mutedForeground: '#64748b',
  border: '#e5e7eb',
  primary: '#2563eb',
  ring: '#60a5fa',
  accent: '#38bdf8',
  ...overrides,
})

describe('useGraphPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return a palette with correct structure', () => {
    const { result } = renderHook(() => useGraphPalette(false, createThemeColors() as any))

    // All palette keys should be present
    const requiredKeys = [
      'background',
      'nodeDefault',
      'nodeActive',
      'nodeNeighbor',
      'nodeHover',
      'labelDefault',
      'labelActive',
      'labelNeighbor',
      'linkMuted',
      'linkActive',
      'border',
      'card',
    ]
    for (const key of requiredKeys) {
      expect(result.current).toHaveProperty(key)
      expect(result.current[key as keyof typeof result.current]).toBeDefined()
    }
  })

  it('should use provided theme colors', () => {
    const themeColors = createThemeColors({
      background: '#custom-bg',
      foreground: '#custom-fg',
      primary: '#custom-primary',
    })

    const { result } = renderHook(() => useGraphPalette(false, themeColors as any))

    // GraphPalette maps themeColors.foreground → nodeDefault
    expect(result.current.background).toBe('#custom-bg')
    expect(result.current.nodeDefault).toBe('#custom-fg')
    expect(result.current.nodeActive).toBe('#custom-primary')
  })

  it('should use fallback colors when theme colors are empty', () => {
    const themeColors = createThemeColors({
      background: '',
      foreground: '',
      primary: '',
    })

    const { result } = renderHook(() => useGraphPalette(false, themeColors as any))

    // Empty strings should trigger fallback
    expect(result.current.background).not.toBe('')
    expect(result.current.foreground).not.toBe('')
    expect(result.current.nodeActive).not.toBe('')
  })

  it('should produce alpha-blended link colors from hex input', () => {
    const themeColors = createThemeColors({
      mutedForeground: '#64748b',
      primary: '#2563eb',
    })

    const { result } = renderHook(() => useGraphPalette(false, themeColors as any))

    // linkMuted uses mutedForeground with alpha 0.35
    expect(result.current.linkMuted).toContain('0.35')
    // linkActive uses primary with alpha 0.95
    expect(result.current.linkActive).toContain('0.95')
  })

  it('should produce alpha-blended link colors for dark mode', () => {
    const themeColors = createThemeColors({
      mutedForeground: '#94a3b8',
      primary: '#60a5fa',
    })

    const { result } = renderHook(() => useGraphPalette(true, themeColors as any))

    // Dark mode link colors
    expect(result.current.linkMuted).toContain('0.35')
    expect(result.current.linkActive).toContain('0.95')
  })

  it('should produce alpha-blended link colors from rgba input', () => {
    const themeColors = createThemeColors({
      mutedForeground: 'rgba(100, 116, 139, 0.5)',
      primary: 'rgba(37, 99, 235, 0.8)',
    })

    const { result } = renderHook(() => useGraphPalette(false, themeColors as any))

    // withAlpha should replace alpha with the specified value
    expect(result.current.linkMuted).toContain('0.35')
    expect(result.current.linkActive).toContain('0.95')
  })

  it('should use same color for nodeDefault and nodeNeighbor', () => {
    const themeColors = createThemeColors()
    const { result } = renderHook(() => useGraphPalette(false, themeColors as any))

    expect(result.current.nodeDefault).toBe(result.current.nodeNeighbor)
  })

  it('should use same color for labelNeighbor and nodeDefault', () => {
    const themeColors = createThemeColors()
    const { result } = renderHook(() => useGraphPalette(false, themeColors as any))

    expect(result.current.labelNeighbor).toBe(result.current.nodeDefault)
  })

  it('should memoize and return same reference with same inputs', () => {
    const themeColors = createThemeColors()
    const { result, rerender } = renderHook(
      ({ isDark, colors }) => useGraphPalette(isDark, colors as any),
      { initialProps: { isDark: false, colors: themeColors } }
    )

    const firstPalette = result.current
    rerender({ isDark: false, colors: themeColors })

    // Same reference since useMemo with same deps
    expect(result.current).toBe(firstPalette)
  })

  it('should recalculate when isDark changes', () => {
    // Use empty strings for some properties so fallbacks are used
    const themeColors = createThemeColors({
      background: '',
      foreground: '',
      primary: '',
    })

    const { result, rerender } = renderHook(
      ({ isDark, colors }) => useGraphPalette(isDark, colors as any),
      { initialProps: { isDark: false, colors: themeColors } }
    )

    // Light mode fallback
    expect(result.current.background).toBe('#ffffff')

    rerender({ isDark: true, colors: themeColors })

    // Dark mode fallback
    expect(result.current.background).toBe('#0b0b0b')
  })

  it('should handle all ThemeColors properties', () => {
    const fullThemeColors: Record<string, string> = {
      background: '#fff',
      foreground: '#000',
      card: '#fff',
      cardForeground: '#000',
      mutedForeground: '#666',
      border: '#ccc',
      primary: '#00f',
      ring: '#0ff',
      accent: '#f0f',
    }

    const { result } = renderHook(() => useGraphPalette(false, fullThemeColors as any))

    // GraphPalette maps ThemeColors to palette properties
    expect(result.current.background).toBe('#fff')
    expect(result.current.nodeDefault).toBe('#000') // from foreground
    expect(result.current.card).toBe('#fff')
    expect(result.current.border).toBe('#ccc')
    expect(result.current.nodeActive).toBe('#00f') // from primary
    expect(result.current.nodeHover).toBe('#f0f') // from accent
    expect(result.current.labelDefault).toBe('#666') // from mutedForeground
    expect(result.current.linkMuted).toBeTruthy() // computed from mutedForeground
    expect(result.current.linkActive).toBeTruthy() // computed from primary
  })
})
