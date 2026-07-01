import { describe, expect, it } from 'vitest'
import { getPairLinePresentation, isValidPairDisplayMode } from '../pairDisplay'

describe('pairDisplay', () => {
  it('returns label prefixes in label mode', () => {
    const original = getPairLinePresentation('label', 'sepia', 'original')
    const translation = getPairLinePresentation('label', 'sepia', 'translation')

    expect(original.prefix).toBe('原文')
    expect(translation.prefix).toBe('译文')
  })

  it('uses different colors in color mode', () => {
    const original = getPairLinePresentation('color', 'sepia', 'original')
    const translation = getPairLinePresentation('color', 'sepia', 'translation')

    expect(original.style.color).not.toBe(translation.style.color)
  })

  it('adds border class for translation in border mode', () => {
    const translation = getPairLinePresentation('border', 'light', 'translation')
    expect(translation.className).toContain('border-l-2')
  })

  it('validates display mode values', () => {
    expect(isValidPairDisplayMode('label')).toBe(true)
    expect(isValidPairDisplayMode('unknown')).toBe(false)
  })
})
