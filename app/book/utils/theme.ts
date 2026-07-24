import { useSyncExternalStore, type CSSProperties } from 'react'

// ─── Types ────────────────────────────────────────────────────────────

export type BookFont = 'yahei' | 'song' | 'longcang'
export type BookTheme = 'auto' | 'light' | 'dark' | 'sepia' | 'green'
export type ResolvedBookTheme = Exclude<BookTheme, 'auto'>

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

function subscribeSystemTheme(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  mql.addEventListener('change', onStoreChange)
  return () => mql.removeEventListener('change', onStoreChange)
}

/** Subscribes to `prefers-color-scheme` so `theme: auto` re-renders on OS change. */
export function useSystemColorScheme(): 'light' | 'dark' {
  return useSyncExternalStore(subscribeSystemTheme, getSystemTheme, () => 'light')
}

export function resolveBookTheme(
  theme: BookTheme,
  systemScheme: 'light' | 'dark' = getSystemTheme()
): ResolvedBookTheme {
  return theme === 'auto' ? systemScheme : theme
}

/** Narration mark colors tuned to each reader theme (not global accent). */
export function getNarrationHighlightStyle(theme: BookTheme): CSSProperties {
  const resolved = resolveBookTheme(theme)

  switch (resolved) {
    case 'dark':
      return {
        backgroundColor: 'rgba(251, 191, 36, 0.42)',
        boxShadow: 'inset 0 -0.12em 0 0 rgba(251, 191, 36, 0.65)',
      }
    case 'sepia':
      return {
        backgroundColor: 'rgba(180, 120, 40, 0.28)',
        boxShadow: 'inset 0 -0.12em 0 0 rgba(140, 90, 30, 0.45)',
      }
    case 'green':
      return {
        backgroundColor: 'rgba(45, 120, 70, 0.28)',
        boxShadow: 'inset 0 -0.12em 0 0 rgba(30, 90, 50, 0.4)',
      }
    default:
      return {
        backgroundColor: 'rgba(251, 191, 36, 0.55)',
        boxShadow: 'inset 0 -0.12em 0 0 rgba(217, 119, 6, 0.55)',
      }
  }
}

export type BookToolbarTheme = {
  headerStyle: CSSProperties
  panelStyle: CSSProperties
  mutedColor: string
  borderColor: string
  accentBg: string
  hoverBg: string
}

export function getBookToolbarTheme(theme: BookTheme): BookToolbarTheme | null {
  const resolved = theme === 'auto' ? getSystemTheme() : theme

  switch (resolved) {
    case 'light':
      return {
        headerStyle: { backgroundColor: 'rgba(255,255,255,0.94)', color: '#1a1a1a' },
        panelStyle: { backgroundColor: 'rgba(255,255,255,0.98)', color: '#1a1a1a' },
        mutedColor: 'rgba(26,26,26,0.62)',
        borderColor: 'rgba(26,26,26,0.14)',
        accentBg: 'rgba(26,26,26,0.1)',
        hoverBg: 'rgba(26,26,26,0.06)',
      }
    case 'dark':
      return {
        headerStyle: { backgroundColor: 'rgba(20,20,20,0.94)', color: '#e8e8e8' },
        panelStyle: { backgroundColor: 'rgba(20,20,20,0.98)', color: '#e8e8e8' },
        mutedColor: 'rgba(232,232,232,0.62)',
        borderColor: 'rgba(232,232,232,0.14)',
        accentBg: 'rgba(232,232,232,0.14)',
        hoverBg: 'rgba(232,232,232,0.08)',
      }
    case 'sepia':
      return {
        headerStyle: { backgroundColor: 'rgba(244,236,216,0.94)', color: '#5c4b37' },
        panelStyle: { backgroundColor: 'rgba(244,236,216,0.98)', color: '#5c4b37' },
        mutedColor: 'rgba(92,75,55,0.62)',
        borderColor: 'rgba(92,75,55,0.18)',
        accentBg: 'rgba(92,75,55,0.14)',
        hoverBg: 'rgba(92,75,55,0.08)',
      }
    case 'green':
      return {
        headerStyle: { backgroundColor: 'rgba(199,237,204,0.94)', color: '#2d3a2d' },
        panelStyle: { backgroundColor: 'rgba(199,237,204,0.98)', color: '#2d3a2d' },
        mutedColor: 'rgba(45,58,45,0.62)',
        borderColor: 'rgba(45,58,45,0.18)',
        accentBg: 'rgba(45,58,45,0.14)',
        hoverBg: 'rgba(45,58,45,0.08)',
      }
    default:
      return null
  }
}

/** CSS variables for themed overlays (popover / select) inside the reader. */
export function getBookOverlayCssVars(
  toolbarTheme: BookToolbarTheme
): CSSProperties & Record<`--book-${string}`, string> {
  return {
    ...toolbarTheme.panelStyle,
    borderColor: toolbarTheme.borderColor,
    '--book-muted': toolbarTheme.mutedColor,
    '--book-accent': toolbarTheme.accentBg,
    '--book-hover': toolbarTheme.hoverBg,
  }
}
