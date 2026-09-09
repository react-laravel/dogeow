'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  BaseReaderSettings,
  PairDisplayMode,
  ReaderContentMode,
  ReaderFont,
  ReaderTheme,
} from '@/app/book/types/reader'

export interface BookSettingsOptions<TSettings extends BaseReaderSettings> {
  storageKey: string
  defaults: TSettings
}

/** Shared appearance for every book. Chapter progress stays on `storageKey`. */
export const BOOK_READER_PREFS_STORAGE_KEY = 'dogeow-book-reader:prefs'

const FONT_VALUES: ReaderFont[] = ['yahei', 'song', 'longcang']
const THEME_VALUES: ReaderTheme[] = ['auto', 'light', 'dark', 'sepia', 'green']
const PAIR_DISPLAY_VALUES: PairDisplayMode[] = [
  'muted',
  'contrast',
  'color',
  'label',
  'card',
  'border',
]
const CONTENT_MODE_VALUES: ReaderContentMode[] = ['both', 'original', 'translation']
const APPEARANCE_KEYS = [
  'originalFontFamily',
  'translationFontFamily',
  'fontSize',
  'lineHeight',
  'theme',
  'pairDisplayMode',
  'contentMode',
] as const

function isValidFont(value: unknown): value is ReaderFont {
  return FONT_VALUES.includes(value as ReaderFont)
}

function isValidTheme(value: unknown): value is ReaderTheme {
  return THEME_VALUES.includes(value as ReaderTheme)
}

function isValidPairDisplay(value: unknown): value is PairDisplayMode {
  return PAIR_DISPLAY_VALUES.includes(value as PairDisplayMode)
}

function isValidContentMode(value: unknown): value is ReaderContentMode {
  return CONTENT_MODE_VALUES.includes(value as ReaderContentMode)
}

function readJson(key: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export function pickAppearance(
  source: Record<string, unknown> | null | undefined,
  defaults: BaseReaderSettings
): BaseReaderSettings {
  const parsed = source ?? {}
  const legacyFont = isValidFont(parsed.fontFamily)
    ? parsed.fontFamily
    : defaults.originalFontFamily
  return {
    originalFontFamily: isValidFont(parsed.originalFontFamily)
      ? parsed.originalFontFamily
      : legacyFont,
    translationFontFamily: isValidFont(parsed.translationFontFamily)
      ? parsed.translationFontFamily
      : legacyFont,
    fontSize: typeof parsed.fontSize === 'number' ? parsed.fontSize : defaults.fontSize,
    lineHeight: typeof parsed.lineHeight === 'number' ? parsed.lineHeight : defaults.lineHeight,
    theme: isValidTheme(parsed.theme) ? parsed.theme : defaults.theme,
    pairDisplayMode: isValidPairDisplay(parsed.pairDisplayMode)
      ? parsed.pairDisplayMode
      : defaults.pairDisplayMode,
    contentMode: isValidContentMode(parsed.contentMode) ? parsed.contentMode : defaults.contentMode,
  }
}

function hasAppearanceFields(source: Record<string, unknown> | null): boolean {
  if (!source) return false
  return APPEARANCE_KEYS.some(key => key in source) || 'fontFamily' in source
}

function appearancePatch(patch: object): boolean {
  return APPEARANCE_KEYS.some(key => key in patch)
}

export function useBookSettings<
  TSettings extends BaseReaderSettings & { chapterId: string | number },
>({
  storageKey,
  defaults,
}: BookSettingsOptions<TSettings>): {
  settings: TSettings
  patchSettings: (patch: Partial<TSettings>) => void
  hydrated: boolean
} {
  const [settings, setSettings] = useState<TSettings>(defaults)
  const [hydrated, setHydrated] = useState(false)
  const defaultsRef = useRef(defaults)

  useEffect(() => {
    defaultsRef.current = defaults
  }, [defaults])

  useEffect(() => {
    queueMicrotask(() => {
      if (typeof window === 'undefined') {
        setHydrated(true)
        return
      }

      const currentDefaults = defaultsRef.current
      const bookStored = readJson(storageKey)
      const prefsStored = readJson(BOOK_READER_PREFS_STORAGE_KEY)
      const appearanceSource = prefsStored ?? (hasAppearanceFields(bookStored) ? bookStored : null)
      if (!prefsStored && appearanceSource) {
        writeJson(BOOK_READER_PREFS_STORAGE_KEY, pickAppearance(appearanceSource, currentDefaults))
      }

      const appearance = pickAppearance(appearanceSource, currentDefaults)
      const chapterId =
        bookStored && 'chapterId' in bookStored
          ? (bookStored.chapterId as TSettings['chapterId'])
          : currentDefaults.chapterId

      setSettings({
        ...currentDefaults,
        ...appearance,
        chapterId,
      })
      setHydrated(true)
    })
  }, [storageKey])

  const patchSettings = useCallback(
    (patch: Partial<TSettings>) => {
      setSettings(prev => {
        const next = { ...prev, ...patch }
        if (typeof window !== 'undefined') {
          if (appearancePatch(patch)) {
            writeJson(BOOK_READER_PREFS_STORAGE_KEY, pickAppearance(next, next))
          }
          if ('chapterId' in patch) {
            writeJson(storageKey, { chapterId: next.chapterId })
          }
        }
        return next
      })
    },
    [storageKey]
  )

  return { settings, patchSettings, hydrated }
}
