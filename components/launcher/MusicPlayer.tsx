'use client'

import React, { memo, useMemo, useState } from 'react'
import { Maximize2, Pause, Play, Loader2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { BackButton } from '@/components/ui/back-button'
import type { MusicPlayerProps } from './types'
import { PlayerControlButton } from './music/PlayerControlButton'
import { TrackInfo } from './music/TrackInfo'
import { ProgressBar } from './music/ProgressBar'
import { LogoButton } from './common/LogoButton'
import { useFilterPersistenceStore } from '@/app/thing/stores/filterPersistenceStore'

// 图标尺寸常量
const ICON_SIZE = 'h-4 w-4'

// 加载状态指示器组件 - 保持与播放按钮相同尺寸
const LoadingIndicator = memo(() => (
  <div data-testid="music-player-loading" className="flex h-9 w-9 items-center justify-center">
    <Loader2 className={`${ICON_SIZE} animate-spin text-foreground/60`} />
  </div>
))
LoadingIndicator.displayName = 'LoadingIndicator'

// 主播放器组件
export const MusicPlayer = memo(
  ({
    isPlaying,
    audioError,
    currentTime,
    duration,
    availableTracks,
    currentTrack,
    readyToPlay,
    isLoadingTracks,
    handleProgressChange,
    getCurrentTrackName,
    currentLyric,
    hasLyrics,
    formatTime,
    togglePlay,
    toggleDisplayMode,
    onOpenFullscreen,
    showLogo = true,
  }: MusicPlayerProps) => {
    const router = useRouter()
    const pathname = usePathname()
    const { clearFilters } = useFilterPersistenceStore()
    const handleBackToApps = () => toggleDisplayMode('apps')
    const [showRemainingTime, setShowRemainingTime] = useState(false)

    // 是否有有效内容：有当前歌曲且播放列表已加载完成
    const hasContent = Boolean(currentTrack) && availableTracks.length > 0
    // 已有当前歌曲且音频已就绪时，后台刷新列表不应打断播放按钮状态
    const isReadyForPlayback = hasContent && readyToPlay !== false
    // 是否正在加载：仅在没有可用内容时加载列表，或当前音频确实还没准备好时展示
    const isLoading =
      (!isReadyForPlayback && isLoadingTracks) || (hasContent && readyToPlay === false)

    const handleLogoClick = () => {
      clearFilters()
      // 从音乐栏点 logo 时应先恢复启动台工具栏；如果当前不在首页，再用
      // Next router 做 SPA 跳转，避免用硬刷新重置状态。
      toggleDisplayMode('apps')

      if (pathname !== '/') {
        router.push('/')
      }
    }

    const timeLabel = useMemo(() => {
      if (showRemainingTime) {
        return `-${formatTime(Math.max(0, duration - currentTime))}`
      }

      return formatTime(currentTime)
    }, [currentTime, duration, formatTime, showRemainingTime])

    return (
      <div
        className={`relative flex h-full w-full min-w-0 flex-col justify-center ${showLogo ? '' : 'pl-14'}`}
      >
        <div className="relative flex w-full min-w-0 items-center gap-2 overflow-hidden">
          <div className="relative z-10 flex shrink-0 items-center gap-3">
            {showLogo && <LogoButton onClick={handleLogoClick} className="h-10 w-10" />}
            <BackButton onClick={handleBackToApps} title="返回启动台" className="h-9 w-9" />
            {(hasContent || isLoading) && (
              <div className="flex items-center justify-center">
                {isLoading ? (
                  <LoadingIndicator />
                ) : (
                  <PlayerControlButton
                    onClick={togglePlay}
                    title={isPlaying ? '暂停' : '播放'}
                    className="h-9 w-9 bg-primary/12 text-primary hover:bg-primary/20"
                    icon={
                      isPlaying ? <Pause className={ICON_SIZE} /> : <Play className={ICON_SIZE} />
                    }
                  />
                )}
              </div>
            )}
          </div>

          <div className="relative z-10 min-w-0 flex-1 overflow-hidden">
            <TrackInfo
              isPlaying={isPlaying}
              getCurrentTrackName={getCurrentTrackName}
              currentLyric={currentLyric}
              hasLyrics={hasLyrics}
            />
          </div>

          {audioError && hasContent && (
            <div className="relative z-10 shrink-0 truncate rounded bg-amber-50 px-2 py-1 text-xs text-amber-600">
              {audioError.includes('播放列表为空') ? '🎵 暂无音乐' : audioError}
            </div>
          )}

          <div className="relative z-10 ml-auto flex shrink-0 items-center gap-2 overflow-hidden">
            {hasContent && (
              <button
                type="button"
                className="hover:bg-accent shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-foreground/80 tabular-nums transition-colors"
                onClick={() => setShowRemainingTime(prev => !prev)}
                title={showRemainingTime ? '点击切换为已播放时间' : '点击切换为倒计时'}
                aria-label={showRemainingTime ? '显示已播放时间' : '显示倒计时'}
              >
                {timeLabel}
              </button>
            )}
            {onOpenFullscreen && (
              <PlayerControlButton
                onClick={onOpenFullscreen}
                title="全屏"
                className="h-9 w-9"
                icon={<Maximize2 className={ICON_SIZE} />}
              />
            )}
          </div>
        </div>

        {hasContent && (
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            handleProgressChange={handleProgressChange}
          />
        )}
      </div>
    )
  }
)
MusicPlayer.displayName = 'MusicPlayer'
