import { describe, expect, it } from 'vitest'
import { PRESET_THEME_COLORS, type PresetThemeColor } from '../theme-colors'

describe('theme-colors', () => {
  it('should have preset theme colors array', () => {
    expect(Array.isArray(PRESET_THEME_COLORS)).toBe(true)
    expect(PRESET_THEME_COLORS.length).toBeGreaterThan(0)
  })

  it('should have required properties in each theme color', () => {
    PRESET_THEME_COLORS.forEach((theme: PresetThemeColor) => {
      expect(theme).toHaveProperty('id')
      expect(theme).toHaveProperty('nameKey')
      expect(theme).toHaveProperty('primary')
      expect(theme).toHaveProperty('color')
    })
  })

  it('should have valid color format', () => {
    PRESET_THEME_COLORS.forEach((theme: PresetThemeColor) => {
      expect(theme.color).toMatch(/^#[0-9a-fA-F]{6}$/)
    })
  })

  it('should have valid primary format (hsl or hex)', () => {
    PRESET_THEME_COLORS.forEach((theme: PresetThemeColor) => {
      const isHSL = theme.primary.startsWith('hsl(')
      const isHex = /^#[0-9a-fA-F]{6}$/.test(theme.primary)
      expect(isHSL || isHex).toBe(true)
    })
  })

  it('should have unique ids', () => {
    const ids = PRESET_THEME_COLORS.map(t => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('should have overwatch theme', () => {
    const overwatch = PRESET_THEME_COLORS.find(t => t.id === 'overwatch')
    expect(overwatch).toBeDefined()
    expect(overwatch?.nameKey).toBe('theme.overwatch')
    expect(overwatch?.color).toBe('#fc9d1c')
  })

  it('should have minecraft theme', () => {
    const minecraft = PRESET_THEME_COLORS.find(t => t.id === 'minecraft')
    expect(minecraft).toBeDefined()
    expect(minecraft?.nameKey).toBe('theme.minecraft')
    expect(minecraft?.color).toBe('#5d9c32')
  })

  it('should have zelda theme', () => {
    const zelda = PRESET_THEME_COLORS.find(t => t.id === 'zelda')
    expect(zelda).toBeDefined()
    expect(zelda?.nameKey).toBe('theme.zelda')
    expect(zelda?.color).toBe('#b99f65')
  })
})
