import type { CSSProperties } from 'react'
import type { PairDisplayMode, ReaderTheme } from '@/app/book/types/reader'

export type PairLineRole = 'original' | 'translation'

export interface PairLinePresentation {
  className: string
  style: CSSProperties
  prefix: string | null
}

const ORIGINAL_LABEL = '原文'
const TRANSLATION_LABEL = '译文'

type ThemePalette = {
  base: string
  translation: string
  originalCard: string
  translationCard: string
}

const THEME_PALETTE: Record<Exclude<ReaderTheme, 'auto'>, ThemePalette> = {
  light: {
    base: '#1a1a1a',
    translation: '#1d4f91',
    originalCard: 'rgba(0,0,0,0.04)',
    translationCard: 'rgba(29,79,145,0.06)',
  },
  dark: {
    base: '#e8e8e8',
    translation: '#8eb4d4',
    originalCard: 'rgba(255,255,255,0.06)',
    translationCard: 'rgba(142,180,212,0.1)',
  },
  sepia: {
    base: '#5c4b37',
    translation: '#8b5e3c',
    originalCard: 'rgba(92,75,55,0.08)',
    translationCard: 'rgba(139,94,60,0.1)',
  },
  green: {
    base: '#2d3a2d',
    translation: '#3d6b45',
    originalCard: 'rgba(45,58,45,0.08)',
    translationCard: 'rgba(61,107,69,0.12)',
  },
}

const AUTO_PALETTE: ThemePalette = {
  base: 'inherit',
  translation: 'hsl(var(--primary))',
  originalCard: 'hsl(var(--muted) / 0.45)',
  translationCard: 'hsl(var(--muted) / 0.25)',
}

function themePalette(theme: ReaderTheme): ThemePalette {
  return theme === 'auto' ? AUTO_PALETTE : THEME_PALETTE[theme]
}

function themeBaseColor(theme: ReaderTheme): string {
  return themePalette(theme).base
}

function themeTranslationHue(theme: ReaderTheme): string {
  return themePalette(theme).translation
}

function themeCardBackground(theme: ReaderTheme, role: PairLineRole): string {
  const palette = themePalette(theme)
  return role === 'original' ? palette.originalCard : palette.translationCard
}

export function getPairLinePresentation(
  mode: PairDisplayMode,
  theme: ReaderTheme,
  role: PairLineRole
): PairLinePresentation {
  const base: PairLinePresentation = {
    className: 'text-pretty',
    style: {},
    prefix: null,
  }

  switch (mode) {
    case 'contrast':
      return {
        ...base,
        style:
          role === 'original'
            ? { fontWeight: 600, opacity: 1 }
            : { opacity: 0.52, fontWeight: 400 },
      }

    case 'color':
      return {
        ...base,
        style: {
          color: role === 'original' ? themeBaseColor(theme) : themeTranslationHue(theme),
        },
      }

    case 'label':
      return {
        ...base,
        className: 'text-pretty flex gap-2',
        prefix: role === 'original' ? ORIGINAL_LABEL : TRANSLATION_LABEL,
        style: role === 'translation' ? { color: themeTranslationHue(theme) } : { fontWeight: 500 },
      }

    case 'card':
      return {
        ...base,
        className: 'text-pretty rounded-md px-3 py-2',
        style: {
          backgroundColor: themeCardBackground(theme, role),
          color: role === 'translation' ? themeTranslationHue(theme) : themeBaseColor(theme),
        },
      }

    case 'border':
      return {
        ...base,
        className: role === 'translation' ? 'text-pretty border-l-2 pl-3' : 'text-pretty',
        style:
          role === 'translation'
            ? {
                borderColor: `color-mix(in srgb, ${themeTranslationHue(theme)} 55%, transparent)`,
                color: themeTranslationHue(theme),
              }
            : { fontWeight: 500 },
      }

    case 'muted':
    default:
      return {
        ...base,
        style:
          role === 'translation'
            ? {
                color:
                  theme === 'auto'
                    ? 'hsl(var(--muted-foreground))'
                    : `color-mix(in srgb, ${themeBaseColor(theme)} 62%, ${themeTranslationHue(theme)})`,
              }
            : {},
      }
  }
}

const PAIR_DISPLAY_MODES: ReadonlySet<PairDisplayMode> = new Set([
  'muted',
  'contrast',
  'color',
  'label',
  'card',
  'border',
])

export function isValidPairDisplayMode(value: unknown): value is PairDisplayMode {
  return typeof value === 'string' && PAIR_DISPLAY_MODES.has(value as PairDisplayMode)
}

export function getTranslationMutedColor(theme: ReaderTheme): string {
  const color = getPairLinePresentation('muted', theme, 'translation').style.color
  return typeof color === 'string' ? color : 'hsl(var(--muted-foreground))'
}
