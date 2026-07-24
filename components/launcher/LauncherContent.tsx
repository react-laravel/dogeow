'use client'

import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { AppsView } from './views/AppsView'
import { SearchResultView } from './views/SearchResultView'
import { ViewWrapper } from './views/ViewWrapper'
import { LogoButton } from './common/LogoButton'
import type { DisplayMode } from './hooks/useLauncherDisplayMode'
import type { PlayMode } from '@/stores/musicStore'
import type { useSearchManager } from '@/hooks/useSearchManager'
import type { useAudioManager } from '@/hooks/useAudioManager'
import type { useTrackLyrics } from './music/useTrackLyrics'

const MusicPlayer = dynamic(() => import('./MusicPlayer').then(mod => mod.MusicPlayer), {
  ssr: false,
})
const AudioVisualizer = dynamic(
  () => import('./music/visualizer').then(mod => mod.AudioVisualizer),
  { ssr: false }
)

interface LauncherContentProps {
  displayMode: DisplayMode
  shouldShowPersistentLogo: boolean
  onPersistentLogoClick: () => void
  router: AppRouterInstance
  searchManager: ReturnType<typeof useSearchManager>
  isAuthenticated: boolean
  toggleDisplayMode: (mode: DisplayMode) => void
  onOpenAi: () => void
  isAiOpen: boolean
  onCloseAi: () => void
  resetSearchResult: () => void
  audioManager: ReturnType<typeof useAudioManager>
  isPlaying: boolean
  audioError: string | null
  isLoadingTracks: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  availableTracks: ReturnType<typeof useAudioManager>['availableTracks']
  currentTrack: string
  playMode: PlayMode
  readyToPlay: boolean
  toggleMute: () => void
  switchToPrevTrack: () => void
  switchToNextTrack: () => void
  togglePlay: () => void
  markUserInteracted: () => void
  handleProgressChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  getCurrentTrackName: () => string
  currentLyric: ReturnType<typeof useTrackLyrics>['currentLyric']
  hasLyrics: boolean
  lyrics: ReturnType<typeof useTrackLyrics>['lyrics']
  activeLyricIndex: number
  lyricsStatus: ReturnType<typeof useTrackLyrics>['status']
  formatTime: (time: number) => string
  setCurrentTrack: (track: string) => void
  setPlayMode: (mode: PlayMode) => void
  onOpenFullscreen: () => void
  audioRef: React.RefObject<HTMLAudioElement | null>
  handoffAudioRef: React.RefObject<HTMLAudioElement | null>
  audioMountKey: number
  handleLoadedMetadata: () => void
  handleTimeUpdate: () => void
  handleAudioError: (e: React.SyntheticEvent<HTMLAudioElement, Event>) => void
  setReadyToPlay: (ready: boolean) => void
}

export function LauncherContent({
  displayMode,
  shouldShowPersistentLogo,
  onPersistentLogoClick,
  router,
  searchManager,
  isAuthenticated,
  toggleDisplayMode,
  onOpenAi,
  isAiOpen,
  onCloseAi,
  resetSearchResult,
  audioManager,
  isPlaying,
  audioError,
  isLoadingTracks,
  currentTime,
  duration,
  volume,
  isMuted,
  availableTracks,
  currentTrack,
  playMode,
  readyToPlay,
  toggleMute,
  switchToPrevTrack,
  switchToNextTrack,
  togglePlay,
  markUserInteracted,
  handleProgressChange,
  getCurrentTrackName,
  currentLyric,
  hasLyrics,
  lyrics,
  activeLyricIndex,
  lyricsStatus,
  formatTime,
  setCurrentTrack,
  setPlayMode,
  onOpenFullscreen,
  audioRef,
  handoffAudioRef,
  audioMountKey,
  handleLoadedMetadata,
  handleTimeUpdate,
  handleAudioError,
  setReadyToPlay,
}: LauncherContentProps) {
  const contentConfig = useMemo(
    () => ({
      music: {
        component: MusicPlayer,
        props: {
          isPlaying,
          audioError,
          isLoadingTracks,
          currentTime,
          duration,
          volume,
          isMuted,
          availableTracks: availableTracks || [],
          currentTrack: currentTrack || '',
          playMode,
          analyserNode: audioManager.analyserNode,
          readyToPlay,
          toggleMute,
          switchToPrevTrack,
          switchToNextTrack,
          togglePlay: () => {
            markUserInteracted()
            togglePlay()
          },
          handleProgressChange,
          getCurrentTrackName,
          currentLyric,
          hasLyrics,
          lyrics,
          activeLyricIndex,
          lyricsStatus,
          formatTime,
          toggleDisplayMode,
          showLogo: false,
          onTrackSelect: (trackPath: string) => setCurrentTrack?.(trackPath),
          onSetPlayMode: (mode: PlayMode) => setPlayMode(mode),
          onOpenFullscreen,
        },
      },
    }),
    [
      isPlaying,
      audioError,
      isLoadingTracks,
      currentTime,
      duration,
      volume,
      isMuted,
      availableTracks,
      currentTrack,
      playMode,
      readyToPlay,
      toggleMute,
      switchToPrevTrack,
      switchToNextTrack,
      togglePlay,
      handleProgressChange,
      getCurrentTrackName,
      currentLyric,
      hasLyrics,
      lyrics,
      activeLyricIndex,
      lyricsStatus,
      formatTime,
      setCurrentTrack,
      toggleDisplayMode,
      setPlayMode,
      markUserInteracted,
      audioManager.analyserNode,
      onOpenFullscreen,
    ]
  )

  const renderContent = () => {
    switch (displayMode) {
      case 'music': {
        const { component: Component, props } = contentConfig.music
        return (
          <ViewWrapper>
            <Component {...props} />
          </ViewWrapper>
        )
      }

      case 'apps':
        return (
          <AppsView
            router={router}
            searchManager={searchManager}
            isAuthenticated={isAuthenticated}
            toggleDisplayMode={toggleDisplayMode}
            onOpenAi={onOpenAi}
            analyserNode={audioManager.analyserNode}
            isAiOpen={isAiOpen}
            onCloseAi={onCloseAi}
            showLogo={false}
          />
        )

      case 'search-result':
        return (
          <SearchResultView searchText={searchManager.searchText} onReset={resetSearchResult} />
        )

      default:
        return null
    }
  }

  return (
    <div id="app-launcher-bar" className="relative z-50 flex h-full w-full flex-col">
      {shouldShowPersistentLogo && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex items-center">
          <div className="pointer-events-auto">
            <LogoButton onClick={onPersistentLogoClick} />
          </div>
        </div>
      )}

      {displayMode === 'music' && audioManager.analyserNode && (
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-0 w-screen -translate-x-1/2 overflow-hidden">
          <AudioVisualizer
            analyserNode={audioManager.analyserNode}
            isPlaying={isPlaying}
            type="bars"
            barCount={40}
            barGap={2}
            barColor="rainbow"
            showGradient={false}
            fitWidth={true}
            className="h-full w-full"
          />
        </div>
      )}

      {renderContent()}

      <audio
        key={audioMountKey}
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onError={handleAudioError}
        onEnded={switchToNextTrack}
        onCanPlay={() => setReadyToPlay(true)}
        loop={false}
        hidden
        preload="none"
        crossOrigin="anonymous"
        playsInline={true}
        webkit-playsinline="true"
        controls={false}
      />
      <audio
        ref={handoffAudioRef}
        onEnded={switchToNextTrack}
        hidden
        preload="none"
        crossOrigin="anonymous"
        playsInline={true}
        webkit-playsinline="true"
        controls={false}
      />
    </div>
  )
}
