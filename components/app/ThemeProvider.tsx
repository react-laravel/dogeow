'use client'

import { useEffect, type ReactNode } from 'react'
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import { useThemeStore, getCurrentThemeColor, isRestPeriodNow } from '@/stores/themeStore'

type ResolvedThemeMode = 'light' | 'dark'

function resolveThemeMode(
  themeMode: string,
  followSystem: boolean,
  restPeriod: { startHour: number; endHour: number },
  systemTheme?: string
): ResolvedThemeMode {
  if (themeMode === 'system' && followSystem) {
    if (systemTheme === 'dark' || systemTheme === 'light') {
      return systemTheme
    }

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark'
    }

    return 'light'
  }

  if (themeMode === 'dark' || themeMode === 'light') {
    return themeMode
  }

  if (themeMode === 'rest') {
    return isRestPeriodNow(restPeriod) ? 'dark' : 'light'
  }

  return 'light'
}

function upsertMeta(name: string, content: string) {
  if (typeof document === 'undefined') return

  let meta = document.querySelector(`meta[name="${name}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', name)
    document.head.appendChild(meta)
  }

  meta.setAttribute('content', content)
}

function syncThemeChrome(themeMode: ResolvedThemeMode) {
  if (typeof document === 'undefined') return

  const chromeColor = themeMode === 'dark' ? '#181512' : '#fbfaf7'
  const root = document.documentElement

  root.style.colorScheme = themeMode
  root.style.removeProperty('background-color')
  document.body?.style.removeProperty('background-color')

  upsertMeta('theme-color', chromeColor)
  upsertMeta('msapplication-TileColor', chromeColor)
  upsertMeta('apple-mobile-web-app-status-bar-style', 'default')
  upsertMeta('color-scheme', 'light dark')
}

function applyTheme(themeMode: ResolvedThemeMode, setTheme: (theme: string) => void) {
  setTheme(themeMode)
  syncThemeChrome(themeMode)
}

/** 处理系统主题变化与颜色变量应用 */
function ThemeHandler() {
  const { followSystem, themeMode, restPeriod, currentTheme, customThemes } = useThemeStore()
  const { setTheme, systemTheme } = useTheme()
  const resolvedThemeMode = resolveThemeMode(themeMode, followSystem, restPeriod, systemTheme)

  useEffect(() => {
    applyTheme(resolvedThemeMode, setTheme)
  }, [resolvedThemeMode, setTheme])

  useEffect(() => {
    const reapplyTheme = () => {
      applyTheme(resolvedThemeMode, setTheme)
      window.requestAnimationFrame(() => applyTheme(resolvedThemeMode, setTheme))
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') reapplyTheme()
    }

    window.addEventListener('pageshow', reapplyTheme)
    window.addEventListener('focus', reapplyTheme)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pageshow', reapplyTheme)
      window.removeEventListener('focus', reapplyTheme)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [resolvedThemeMode, setTheme])

  useEffect(() => {
    if (themeMode !== 'rest') return

    const tick = () => {
      applyTheme(isRestPeriodNow(restPeriod) ? 'dark' : 'light', setTheme)
    }
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [themeMode, restPeriod, setTheme])

  useEffect(() => {
    const themeColor = getCurrentThemeColor(currentTheme, customThemes)
    const root = document.documentElement
    root.style.setProperty('--primary', themeColor.primary)
    root.style.setProperty('--primary-color', themeColor.color)
  }, [currentTheme, customThemes])

  return null
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem>
      <ThemeHandler />
      {children}
    </NextThemesProvider>
  )
}
