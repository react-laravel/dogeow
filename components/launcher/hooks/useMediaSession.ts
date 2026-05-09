import { useCallback, useEffect, useRef } from 'react'
import type { MusicTrack } from '@/stores/musicStore'

const PAUSED_PLAYBACK_STATE_DELAY_MS = 1500

interface UseMediaSessionProps {
  currentTrack: string
  availableTracks?: MusicTrack[]
  isPlaying: boolean
  togglePlay: () => void
  switchToPrevTrack: () => void
  switchToNextTrack: () => void
}

export function useMediaSession({
  currentTrack,
  availableTracks,
  isPlaying,
  togglePlay,
  switchToPrevTrack,
  switchToNextTrack,
}: UseMediaSessionProps) {
  const isPlayingRef = useRef(isPlaying)
  const pausePlaybackStateTimeoutRef = useRef<number | null>(null)
  const backgroundTransitionAtRef = useRef<number | null>(null)

  const clearPendingPausePlaybackState = useCallback(() => {
    if (pausePlaybackStateTimeoutRef.current !== null) {
      window.clearTimeout(pausePlaybackStateTimeoutRef.current)
      pausePlaybackStateTimeoutRef.current = null
    }
  }, [])

  const markBackgroundTransition = useCallback(() => {
    backgroundTransitionAtRef.current = Date.now()
  }, [])

  const isDuringBackgroundTransition = useCallback(() => {
    const startedAt = backgroundTransitionAtRef.current

    return startedAt !== null && Date.now() - startedAt < PAUSED_PLAYBACK_STATE_DELAY_MS
  }, [])

  const syncPlaybackState = useCallback((playbackState: MediaSessionPlaybackState) => {
    if (!('mediaSession' in navigator) || !navigator.mediaSession) return

    if (navigator.mediaSession.playbackState !== playbackState) {
      navigator.mediaSession.playbackState = playbackState
    }
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        markBackgroundTransition()
      }
    }

    const handleWindowBlur = () => {
      markBackgroundTransition()
    }

    const handlePageHide = () => {
      markBackgroundTransition()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('pagehide', handlePageHide)
      clearPendingPausePlaybackState()
    }
  }, [clearPendingPausePlaybackState, markBackgroundTransition])

  // Media Session API 支持
  useEffect(() => {
    if (!('mediaSession' in navigator) || !navigator.mediaSession) return

    isPlayingRef.current = isPlaying

    // 更新元数据
    if (currentTrack && availableTracks && availableTracks.length > 0) {
      const currentTrackInfo = availableTracks.find(track => track.path === currentTrack)

      if (currentTrackInfo) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrackInfo.name || '未知歌曲',
          artist: '本地音乐播放器',
          album: '本地音乐',
          // 可以添加封面图
          // artwork: [{ src: '/cover.jpg', sizes: '512x512', type: 'image/jpeg' }]
        })
      }
    }

    clearPendingPausePlaybackState()

    if (isPlaying) {
      syncPlaybackState('playing')
      return
    }

    const shouldDelayPausePlaybackState =
      (typeof document !== 'undefined' && document.hidden) || isDuringBackgroundTransition()

    if (shouldDelayPausePlaybackState) {
      pausePlaybackStateTimeoutRef.current = window.setTimeout(() => {
        pausePlaybackStateTimeoutRef.current = null

        if (!isPlayingRef.current) {
          syncPlaybackState('paused')
        }
      }, PAUSED_PLAYBACK_STATE_DELAY_MS)

      return
    }

    syncPlaybackState('paused')
  }, [
    availableTracks,
    clearPendingPausePlaybackState,
    currentTrack,
    isDuringBackgroundTransition,
    isPlaying,
    syncPlaybackState,
  ])

  // 设置动作处理程序（只在挂载时设置一次）
  useEffect(() => {
    if (!('mediaSession' in navigator) || !navigator.mediaSession) return

    const mediaSession = navigator.mediaSession

    mediaSession.setActionHandler('play', () => {
      if (!isPlayingRef.current) {
        togglePlay()
      }
    })

    mediaSession.setActionHandler('pause', () => {
      if (isPlayingRef.current) {
        togglePlay()
      }
    })

    mediaSession.setActionHandler('previoustrack', () => {
      switchToPrevTrack()
    })

    mediaSession.setActionHandler('nexttrack', () => {
      switchToNextTrack()
    })

    // 清理函数
    return () => {
      mediaSession.setActionHandler('play', null)
      mediaSession.setActionHandler('pause', null)
      mediaSession.setActionHandler('previoustrack', null)
      mediaSession.setActionHandler('nexttrack', null)
    }
  }, [togglePlay, switchToPrevTrack, switchToNextTrack])

  // 监听系统媒体控制事件
  useEffect(() => {
    if (!('mediaSession' in navigator) || !navigator.mediaSession) return

    return () => {}
  }, [togglePlay, switchToPrevTrack, switchToNextTrack])
}
