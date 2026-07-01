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

function themeBaseColor(theme: ReaderTheme): string {
  switch (theme) {
    case 'dark':
      return '#e8e8e8'
    case 'sepia':
      return '#5c4b37'
    case 'green':
      return '#2d3a2d'
    case 'light':
      return '#1a1a1a'
    default:
      return 'inherit'
  }
}

function themeTranslationHue(theme: ReaderTheme): string {
  switch (theme) {
    case 'dark':
      return '#8eb4d4'
    case 'sepia':
      return '#8b5e3c'
    case 'green':
      return '#3d6b45'
    case 'light':
      return '#1d4f91'
    default:
      return 'hsl(var(--primary))'
  }
}

function themeCardBackground(theme: ReaderTheme, role: PairLineRole): string {
  if (role === 'original') {
    switch (theme) {
      case 'dark':
        return 'rgba(255,255,255,0.06)'
      case 'sepia':
        return 'rgba(92,75,55,0.08)'
      case 'green':
        return 'rgba(45,58,45,0.08)'
      case 'light':
        return 'rgba(0,0,0,0.04)'
      default:
        return 'hsl(var(--muted) / 0.45)'
    }
  }

  switch (theme) {
    case 'dark':
      return 'rgba(142,180,212,0.1)'
    case 'sepia':
      return 'rgba(139,94,60,0.1)'
    case 'green':
      return 'rgba(61,107,69,0.12)'
    case 'light':
      return 'rgba(29,79,145,0.06)'
    default:
      return 'hsl(var(--muted) / 0.25)'
  }
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

export function isValidPairDisplayMode(value: unknown): value is PairDisplayMode {
  return (
    value === 'muted' ||
    value === 'contrast' ||
    value === 'color' ||
    value === 'label' ||
    value === 'card' ||
    value === 'border'
  )
}

export function getTranslationMutedColor(theme: ReaderTheme): string {
  const color = getPairLinePresentation('muted', theme, 'translation').style.color
  return typeof color === 'string' ? color : 'hsl(var(--muted-foreground))'
}
