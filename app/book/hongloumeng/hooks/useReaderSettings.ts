'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { getPairLinePresentation, isValidPairDisplayMode } from '../utils/pairDisplay'

export type ReaderFont = 'yahei' | 'song' | 'longcang'
export type ReaderTheme = 'auto' | 'light' | 'dark' | 'sepia' | 'green'
export type PairDisplayMode = 'muted' | 'contrast' | 'color' | 'label' | 'card' | 'border'

export type ReaderContentMode = 'both' | 'original' | 'translation'

export interface ReaderSettings {
  fontFamily: ReaderFont
  fontSize: number
  lineHeight: number
  theme: ReaderTheme
  pairDisplayMode: PairDisplayMode
  contentMode: ReaderContentMode
  chapterId: number
}

const STORAGE_KEY = 'dogeow-hongloumeng-reader'

export const READER_FONT_LABELS: Record<ReaderFont, string> = {
  yahei: '雅黑',
  song: '宋体',
  longcang: '龙藏体',
}

export const READER_THEME_LABELS: Record<ReaderTheme, string> = {
  auto: '跟随系统',
  light: '浅色',
  dark: '深色',
  sepia: '护眼暖色',
  green: '护眼豆沙绿',
}

export const READER_CONTENT_MODE_LABELS: Record<ReaderContentMode, string> = {
  both: '对照',
  original: '原文',
  translation: '译文',
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontFamily: 'yahei',
  fontSize: 20,
  lineHeight: 1.9,
  theme: 'sepia',
  pairDisplayMode: 'muted',
  contentMode: 'both',
  chapterId: 1,
}

function isValidContentMode(value: unknown): value is ReaderContentMode {
  return value === 'both' || value === 'original' || value === 'translation'
}

function readStoredSettings(): ReaderSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<ReaderSettings> & { showTranslation?: boolean }
    const legacyContentMode =
      parsed.showTranslation === false
        ? 'original'
        : parsed.showTranslation === true
          ? 'both'
          : undefined
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      pairDisplayMode: isValidPairDisplayMode(parsed.pairDisplayMode)
        ? parsed.pairDisplayMode
        : DEFAULT_SETTINGS.pairDisplayMode,
      contentMode: isValidContentMode(parsed.contentMode)
        ? parsed.contentMode
        : (legacyContentMode ?? DEFAULT_SETTINGS.contentMode),
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      setSettings(readStoredSettings())
      setHydrated(true)
    })
  }, [])

  const patchSettings = useCallback((patch: Partial<ReaderSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const bumpFontSize = useCallback((delta: number) => {
    setSettings(prev => {
      const fontSize = Math.min(32, Math.max(14, prev.fontSize + delta))
      const next = { ...prev, fontSize }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { settings, patchSettings, bumpFontSize, hydrated }
}

export function getReaderFontFamily(font: ReaderFont): string {
  switch (font) {
    case 'song':
      return "var(--font-noto-serif-sc, 'Noto Serif SC', 'STSong', 'SimSun', serif)"
    case 'longcang':
      return 'var(--font-long-cang, serif)'
    default:
      return 'var(--font-sans)'
  }
}

export function getReaderThemeStyle(theme: ReaderTheme): CSSProperties | undefined {
  switch (theme) {
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

export function getTranslationMutedColor(theme: ReaderTheme): string {
  const color = getPairLinePresentation('muted', theme, 'translation').style.color
  return typeof color === 'string' ? color : 'hsl(var(--muted-foreground))'
}
