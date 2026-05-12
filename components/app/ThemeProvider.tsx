'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useThemeStore, getCurrentThemeColor, isRestPeriodNow } from '@/stores/themeStore'
import { useEffect } from 'react'
import { useTheme } from 'next-themes'

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
  if (typeof document === 'undefined') {
    return
  }

  let meta = document.querySelector(`meta[name="${name}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', name)
    document.head.appendChild(meta)
  }

  meta.setAttribute('content', content)
}

function syncThemeChrome(themeMode: ResolvedThemeMode) {
  if (typeof document === 'undefined') {
    return
  }

  const isDark = themeMode === 'dark'
  const backgroundColor = isDark ? '#000000' : '#ffffff'
  const statusBarStyle = isDark ? 'black-translucent' : 'default'
  const root = document.documentElement

  root.style.colorScheme = themeMode
  root.style.backgroundColor = backgroundColor

  if (document.body) {
    document.body.style.backgroundColor = backgroundColor
  }

  upsertMeta('theme-color', backgroundColor)
  upsertMeta('msapplication-TileColor', backgroundColor)
  upsertMeta('apple-mobile-web-app-status-bar-style', statusBarStyle)
  upsertMeta('color-scheme', 'light dark')
}

// 内部组件用于处理系统主题变化与颜色变量应用
function ThemeHandler() {
  const { followSystem, themeMode, restPeriod, currentTheme, customThemes } = useThemeStore()
  const { setTheme, systemTheme } = useTheme()
  const resolvedThemeMode = resolveThemeMode(themeMode, followSystem, restPeriod, systemTheme)

  // 根据 themeMode 设置外观：浅色、深色、跟随系统、休息时段
  useEffect(() => {
    setTheme(resolvedThemeMode)
    syncThemeChrome(resolvedThemeMode)
  }, [resolvedThemeMode, setTheme])

  // 休息时段模式：每分钟检查一次，到点自动切换
  useEffect(() => {
    if (themeMode !== 'rest') return
    const tick = () => {
      const nextThemeMode = isRestPeriodNow(restPeriod) ? 'dark' : 'light'
      setTheme(nextThemeMode)
      syncThemeChrome(nextThemeMode)
    }
    const id = setInterval(tick, 60 * 1000)
    return () => clearInterval(id)
  }, [themeMode, restPeriod, setTheme])

  // 动态应用主题颜色到CSS变量
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const themeColor = getCurrentThemeColor(currentTheme, customThemes)
      const root = document.documentElement

      // 应用主题颜色到CSS变量
      root.style.setProperty('--primary', themeColor.primary)
      root.style.setProperty('--primary-color', themeColor.color)
    }
  }, [currentTheme, customThemes])

  return null
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem>
      <ThemeHandler />
      {children}
    </NextThemesProvider>
  )
}
