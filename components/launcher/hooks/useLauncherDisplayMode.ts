'use client'

import { useState, useCallback, useEffect, useRef, startTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { useSearchManager } from '@/hooks/useSearchManager'

export type DisplayMode = 'music' | 'apps' | 'settings' | 'auth' | 'search-result'

interface UseLauncherDisplayModeOptions {
  fetchAvailableTracks: () => void | Promise<void>
  availableTracks: { path: string }[]
  setCurrentTrack: (track: string) => void
  searchManager: ReturnType<typeof useSearchManager>
  clearFilters: () => void
  closeAi: () => void
  isAiOpen: boolean
}

export function useLauncherDisplayMode({
  fetchAvailableTracks,
  availableTracks,
  setCurrentTrack,
  searchManager,
  clearFilters,
  closeAi,
  isAiOpen,
}: UseLauncherDisplayModeOptions) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [displayMode, setDisplayMode] = useState<DisplayMode>('apps')
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [isFullscreenViz, setIsFullscreenViz] = useState(false)
  const [fullscreenPanel, setFullscreenPanel] = useState<'lyrics' | 'playlist'>('lyrics')
  const lastAppliedShareTrackRef = useRef<string | null>(null)
  const pendingSharedTrackIndexRef = useRef<number | null>(null)

  const toggleDisplayMode = useCallback(
    (mode: DisplayMode) => {
      if (mode === 'settings') {
        setIsSettingsDialogOpen(true)
        return
      }

      if (mode === 'auth') {
        setIsAuthDialogOpen(true)
        return
      }

      setDisplayMode(mode)

      if (mode === 'music') {
        fetchAvailableTracks()
      }
    },
    [fetchAvailableTracks]
  )

  const resetSearchResult = useCallback(() => {
    setDisplayMode('apps')
    searchManager.setSearchText('')
  }, [searchManager])

  const clearSharedTrackParam = useCallback(() => {
    if (!searchParams.get('m')) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    params.delete('m')

    const nextQuery = params.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const navigateHome = useCallback(() => {
    if (searchManager.isHomePage) {
      return
    }

    router.push('/')
  }, [router, searchManager.isHomePage])

  const handlePersistentLogoClick = useCallback(() => {
    if (displayMode === 'apps') {
      if (isAiOpen) {
        closeAi()
        return
      }

      clearFilters()
      navigateHome()
      return
    }

    if (displayMode === 'music') {
      clearFilters()
      setDisplayMode('apps')

      if (pathname !== '/') {
        router.push('/')
      }
    }
  }, [clearFilters, closeAi, displayMode, isAiOpen, navigateHome, pathname, router])

  const shouldShowPersistentLogo = displayMode === 'apps' || displayMode === 'music'

  useEffect(() => {
    const sharedTrackValue = searchParams.get('m')
    if (lastAppliedShareTrackRef.current === sharedTrackValue) return

    const sharedTrackIndex = Number(sharedTrackValue ?? '')

    if (!Number.isInteger(sharedTrackIndex) || sharedTrackIndex <= 0) {
      lastAppliedShareTrackRef.current = sharedTrackValue
      return
    }

    lastAppliedShareTrackRef.current = sharedTrackValue
    pendingSharedTrackIndexRef.current = sharedTrackIndex - 1
    startTransition(() => {
      setDisplayMode('music')
      setFullscreenPanel('lyrics')
      setIsFullscreenViz(true)
    })
    void fetchAvailableTracks()
  }, [fetchAvailableTracks, searchParams])

  useEffect(() => {
    const pendingIndex = pendingSharedTrackIndexRef.current
    if (pendingIndex === null || pendingIndex < 0 || pendingIndex >= availableTracks.length) {
      return
    }

    const sharedTrack = availableTracks[pendingIndex]
    if (!sharedTrack) {
      return
    }

    pendingSharedTrackIndexRef.current = null
    startTransition(() => {
      setCurrentTrack(sharedTrack.path)
    })
  }, [availableTracks, setCurrentTrack])

  return {
    displayMode,
    setDisplayMode,
    isSettingsDialogOpen,
    setIsSettingsDialogOpen,
    isAuthDialogOpen,
    setIsAuthDialogOpen,
    isFullscreenViz,
    setIsFullscreenViz,
    fullscreenPanel,
    setFullscreenPanel,
    toggleDisplayMode,
    resetSearchResult,
    clearSharedTrackParam,
    handlePersistentLogoClick,
    shouldShowPersistentLogo,
  }
}
