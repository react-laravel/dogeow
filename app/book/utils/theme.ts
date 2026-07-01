import type { CSSProperties } from 'react'

// ─── Types ────────────────────────────────────────────────────────────

export type BookFont = 'yahei' | 'song' | 'longcang'
export type BookTheme = 'auto' | 'light' | 'dark' | 'sepia' | 'green'

// ─── Labels ──────────────────────────────────────────────────────────

export const BOOK_FONT_LABELS: Record<BookFont, string> = {
  yahei: '雅黑',
  song: '宋体',
  longcang: '龙藏体',
}

export const BOOK_THEME_LABELS: Record<BookTheme, string> = {
  auto: '跟随系统',
  light: '浅色',
  dark: '深色',
  sepia: '护眼暖色',
  green: '护眼豆沙绿',
}

// ─── Font family ─────────────────────────────────────────────────────

export function getBookFontFamily(font: BookFont): string {
  switch (font) {
    case 'song':
      return "var(--font-noto-serif-sc, 'Noto Serif SC', 'STSong', 'SimSun', serif)"
    case 'longcang':
      return 'var(--font-long-cang, serif)'
    default:
      return 'var(--font-sans)'
  }
}

// ─── Theme styles ────────────────────────────────────────────────────

export function getBookThemeStyle(theme: BookTheme): CSSProperties | undefined {
  const resolved = theme === 'auto' ? getSystemTheme() : theme

  switch (resolved) {
    case 'light':
      return { backgroundColor: '#ffffff', color: '#1a1a1a' }
    case 'dark':
      return { backgroundColor: '#141414', color: '#e8e8e8' }
    case 'sepia':
      return { backgroundColor: '#f4ecd8', color: '#5c4b37' }
    case 'green':
      return { backgroundColor: '#c7edcc', color: '#2d3a2d' }
    default:
      return undefined
  }
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getBookToolbarTheme(theme: BookTheme): {
  headerStyle: CSSProperties
  mutedColor: string
  borderColor: string
} | null {
  const resolved = theme === 'auto' ? getSystemTheme() : theme

  switch (resolved) {
    case 'light':
      return {
        headerStyle: { backgroundColor: 'rgba(255,255,255,0.94)', color: '#1a1a1a' },
        mutedColor: 'rgba(26,26,26,0.62)',
        borderColor: 'rgba(26,26,26,0.14)',
      }
    case 'dark':
      return {
        headerStyle: { backgroundColor: 'rgba(20,20,20,0.94)', color: '#e8e8e8' },
        mutedColor: 'rgba(232,232,232,0.62)',
        borderColor: 'rgba(232,232,232,0.14)',
      }
    case 'sepia':
      return {
        headerStyle: { backgroundColor: 'rgba(244,236,216,0.94)', color: '#5c4b37' },
        mutedColor: 'rgba(92,75,55,0.62)',
        borderColor: 'rgba(92,75,55,0.18)',
      }
    case 'green':
      return {
        headerStyle: { backgroundColor: 'rgba(199,237,204,0.94)', color: '#2d3a2d' },
        mutedColor: 'rgba(45,58,45,0.62)',
        borderColor: 'rgba(45,58,45,0.18)',
      }
    default:
      return null
  }
}
