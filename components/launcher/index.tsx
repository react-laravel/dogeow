'use client'

import React, { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { CustomBackground } from './SettingsPanel'
import { useRouter, usePathname } from 'next/navigation'
import useAuthStore from '@/stores/authStore'
import { useAudioManager } from '@/hooks/useAudioManager'
import { useSearchManager } from '@/hooks/useSearchManager'
import { useBackgroundManager } from '@/hooks/useBackgroundManager'
import { useMusicStore } from '@/stores/musicStore'
import { useFilterPersistenceStore } from '@/app/thing/stores/filterPersistenceStore'
import { useLauncherDisplayMode } from './hooks/useLauncherDisplayMode'
import { useLauncherPlayback } from './hooks/useLauncherPlayback'
import { LauncherContent } from './LauncherContent'

const AiDialog = dynamic(
  () => import('@/components/app/AiDialog').then(m => ({ default: m.AiDialog })),
  { ssr: false }
)
const AuthDialog = dynamic(
  () => import('@/components/launcher/AuthPanel').then(mod => mod.AuthDialog),
  { ssr: false }
)
const SearchDialog = dynamic(
  () => import('@/components/search/SearchDialog').then(mod => mod.SearchDialog),
  { ssr: false }
)
const SettingsDialog = dynamic(
  () => import('./settings/SettingsDialog').then(mod => mod.SettingsDialog),
  { ssr: false }
)
const FullscreenVisualizer = dynamic(
  () => import('./music/FullscreenVisualizer').then(mod => mod.FullscreenVisualizer),
  { ssr: false }
)

export interface AppLauncherProps {
  /** 点击 AI 按钮时切换通用 AI 面板（打开/关闭） */
  onOpenAi?: () => void
  /** 点击视觉 AI 按钮时由主题 Header 打开视觉 AI 面板 */
  onOpenVisionAi?: () => void
  /** 由主题 Header 传入：AI 是否打开，用于 logo 点击时先关闭 AI */
  isAiOpen?: boolean
  /** 由主题 Header 传入：关闭 AI 的回调 */
  onCloseAi?: () => void
}

export function AppLauncher({
  onOpenAi,
  onOpenVisionAi: _onOpenVisionAi,
  isAiOpen: isAiOpenFromParent,
  onCloseAi,
}: AppLauncherProps = {}) {
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false)
  const isAiOpen = isAiOpenFromParent ?? isAiDialogOpen
  const closeAi = useCallback(() => {
    if (onCloseAi) {
      onCloseAi()
      return
    }

    setIsAiDialogOpen(false)
  }, [onCloseAi])
  const toggleAi = useCallback(() => {
    if (onOpenAi) {
      onOpenAi()
      return
    }

    setIsAiDialogOpen(prev => !prev)
  }, [onOpenAi])
  const [customBackgrounds, setCustomBackgrounds] = useState<CustomBackground[]>([])
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()
  const { clearFilters } = useFilterPersistenceStore()
  const { playMode, setPlayMode } = useMusicStore()

  const audioManager = useAudioManager()
  const searchManager = useSearchManager(pathname)
  const { backgroundImage, setBackgroundImage } = useBackgroundManager()

  const {
    audioRef,
    isPlaying,
    audioError,
    isLoadingTracks,
    currentTime,
    duration,
    volume,
    isMuted,
    availableTracks,
    currentTrack,
    readyToPlay,
    setReadyToPlay,
    fetchAvailableTracks,
    setIsPlaying,
    setCurrentTrack,
    togglePlay,
    toggleMute,
    markUserInteracted,
    handleProgressChange,
    handleLoadedMetadata,
    handleTimeUpdate,
    handleAudioError,
    getCurrentTrackName,
    formatTime,
    audioMountKey,
    handoffAudioRef,
  } = audioManager

  const {
    displayMode,
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
  } = useLauncherDisplayMode({
    fetchAvailableTracks,
    availableTracks: availableTracks || [],
    setCurrentTrack,
    searchManager,
    clearFilters,
    closeAi,
    isAiOpen,
  })

  const {
    switchToNextTrack,
    switchToPrevTrack,
    handleFullscreenTrackPlay,
    currentLyric,
    lyrics,
    activeLyricIndex,
    lyricsStatus,
    hasLyrics,
  } = useLauncherPlayback({ audioManager })

  return (
    <>
      {!onOpenAi && isAiDialogOpen && (
        <AiDialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen} />
      )}
      {isAuthDialogOpen && (
        <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
      )}
      {searchManager.isSearchDialogOpen && (
        <SearchDialog
          open={searchManager.isSearchDialogOpen}
          onOpenChange={searchManager.setIsSearchDialogOpen}
          initialSearchTerm={searchManager.searchTerm}
          currentRoute={!searchManager.isHomePage ? pathname : undefined}
        />
      )}

      {isSettingsDialogOpen && (
        <SettingsDialog
          open={isSettingsDialogOpen}
          onOpenChange={setIsSettingsDialogOpen}
          backgroundImage={backgroundImage}
          setBackgroundImage={setBackgroundImage}
          customBackgrounds={customBackgrounds}
          setCustomBackgrounds={setCustomBackgrounds}
        />
      )}

      {isFullscreenViz && (
        <FullscreenVisualizer
          analyserNode={audioManager.analyserNode}
          isPlaying={isPlaying}
          isMuted={isMuted}
          trackName={getCurrentTrackName() || '未知曲目'}
          onClose={() => {
            setIsFullscreenViz(false)
            clearSharedTrackParam()
          }}
          onTogglePlay={togglePlay}
          onToggleMute={toggleMute}
          onPrevTrack={switchToPrevTrack}
          onNextTrack={switchToNextTrack}
          availableTracks={availableTracks || []}
          currentTrack={currentTrack || ''}
          onTrackPlay={handleFullscreenTrackPlay}
          onTrackSelect={(trackPath: string) => {
            if (trackPath === currentTrack) {
              togglePlay()
              return
            }

            setCurrentTrack?.(trackPath)
            setIsPlaying(true)
          }}
          playMode={playMode}
          onSetPlayMode={setPlayMode}
          currentTime={currentTime}
          duration={duration}
          handleProgressChange={handleProgressChange}
          formatTime={formatTime}
          lyrics={lyrics}
          activeLyricIndex={activeLyricIndex}
          lyricsStatus={lyricsStatus}
          activePanel={fullscreenPanel}
          onActivePanelChange={setFullscreenPanel}
        />
      )}

      <LauncherContent
        displayMode={displayMode}
        shouldShowPersistentLogo={shouldShowPersistentLogo}
        onPersistentLogoClick={handlePersistentLogoClick}
        router={router}
        searchManager={searchManager}
        isAuthenticated={isAuthenticated}
        toggleDisplayMode={toggleDisplayMode}
        onOpenAi={toggleAi}
        isAiOpen={isAiOpen}
        onCloseAi={closeAi}
        resetSearchResult={resetSearchResult}
        audioManager={audioManager}
        isPlaying={isPlaying}
        audioError={audioError}
        isLoadingTracks={isLoadingTracks}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        availableTracks={availableTracks}
        currentTrack={currentTrack || ''}
        playMode={playMode}
        readyToPlay={readyToPlay}
        toggleMute={toggleMute}
        switchToPrevTrack={switchToPrevTrack}
        switchToNextTrack={switchToNextTrack}
        togglePlay={togglePlay}
        markUserInteracted={markUserInteracted}
        handleProgressChange={handleProgressChange}
        getCurrentTrackName={getCurrentTrackName}
        currentLyric={currentLyric}
        hasLyrics={hasLyrics}
        lyrics={lyrics}
        activeLyricIndex={activeLyricIndex}
        lyricsStatus={lyricsStatus}
        formatTime={formatTime}
        setCurrentTrack={trackPath => setCurrentTrack?.(trackPath)}
        setPlayMode={setPlayMode}
        onOpenFullscreen={() => setIsFullscreenViz(true)}
        audioRef={audioRef}
        handoffAudioRef={handoffAudioRef}
        audioMountKey={audioMountKey}
        handleLoadedMetadata={handleLoadedMetadata}
        handleTimeUpdate={handleTimeUpdate}
        handleAudioError={handleAudioError}
        setReadyToPlay={setReadyToPlay}
      />
    </>
  )
}
