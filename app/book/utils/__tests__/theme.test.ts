import { describe, expect, it } from 'vitest'
import { getNarrationHighlightStyle, resolveBookTheme } from '../theme'

describe('resolveBookTheme', () => {
  it('passes through concrete themes', () => {
    expect(resolveBookTheme('green')).toBe('green')
    expect(resolveBookTheme('sepia')).toBe('sepia')
  })

  it('resolves auto from system scheme', () => {
    expect(resolveBookTheme('auto', 'dark')).toBe('dark')
    expect(resolveBookTheme('auto', 'light')).toBe('light')
  })
})

describe('getNarrationHighlightStyle', () => {
  it('returns distinct highlight styles per theme', () => {
    const light = getNarrationHighlightStyle('light')
    const green = getNarrationHighlightStyle('green')
    const dark = getNarrationHighlightStyle('dark')

    expect(light.backgroundColor).toBeTruthy()
    expect(green.backgroundColor).not.toBe(light.backgroundColor)
    expect(dark.backgroundColor).not.toBe(light.backgroundColor)
  })
})
