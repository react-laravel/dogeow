'use client'

import { useCallback, useEffect, useState } from 'react'
import type {
  ReaderSettings,
  ReaderTheme,
  ReaderFont,
} from '@/app/book/hongloumeng/hooks/useReaderSettings'

export interface BookSettingsOptions<TSettings extends ReaderSettings> {
  storageKey: string
  defaults: TSettings
}

const FONT_VALUES: ReaderFont[] = ['yahei', 'song', 'longcang']
const THEME_VALUES: ReaderTheme[] = ['auto', 'light', 'dark', 'sepia', 'green']

function isValidFont(value: unknown): value is ReaderFont {
  return FONT_VALUES.includes(value as ReaderFont)
}

function isValidTheme(value: unknown): value is ReaderTheme {
  return THEME_VALUES.includes(value as ReaderTheme)
}

export function useBookSettings<TSettings extends ReaderSettings>({
  storageKey,
  defaults,
}: BookSettingsOptions<TSettings>): {
  settings: TSettings
  patchSettings: (patch: Partial<TSettings>) => void
  hydrated: boolean
} {
  const [settings, setSettings] = useState<TSettings>(defaults)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      if (typeof window === 'undefined') {
        setHydrated(true)
        return
      }
      try {
        const raw = localStorage.getItem(storageKey)
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<TSettings>
          const font = isValidFont((parsed as Record<string, unknown>).fontFamily)
            ? ((parsed as Record<string, unknown>).fontFamily as ReaderFont)
            : 'yahei'
          setSettings({
            ...defaults,
            ...parsed,
            originalFontFamily: isValidFont((parsed as Record<string, unknown>).originalFontFamily)
              ? ((parsed as Record<string, unknown>).originalFontFamily as ReaderFont)
              : font,
            translationFontFamily: isValidFont(
              (parsed as Record<string, unknown>).translationFontFamily
            )
              ? ((parsed as Record<string, unknown>).translationFontFamily as ReaderFont)
              : font,
            theme: isValidTheme(parsed.theme) ? parsed.theme : defaults.theme,
          })
        }
      } catch {
        // ignore
      }
      setHydrated(true)
    })
  }, [storageKey, defaults])

  const patchSettings = useCallback(
    (patch: Partial<TSettings>) => {
      setSettings(prev => {
        const next = { ...prev, ...patch }
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(next))
        }
        return next
      })
    },
    [storageKey]
  )

  return { settings, patchSettings, hydrated }
}
