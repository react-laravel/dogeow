import { useEffect, useRef } from 'react'
import type { MusicTrack } from '@/stores/musicStore'

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
  // 使用 ref 跟踪上次播放状态，避免不必要的更新
  const prevIsPlayingRef = useRef(isPlaying)
  const isPlayingRef = useRef(isPlaying)

  // Media Session API 支持
  useEffect(() => {
    if (!('mediaSession' in navigator)) return

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

    // 首次和变更时都同步 playbackState
    if (prevIsPlayingRef.current !== isPlaying) {
      prevIsPlayingRef.current = isPlaying
    }
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }, [currentTrack, availableTracks, isPlaying])

  // 设置动作处理程序（只在挂载时设置一次）
  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    navigator.mediaSession.setActionHandler('play', () => {
      if (!isPlayingRef.current) {
        togglePlay()
      }
    })

    navigator.mediaSession.setActionHandler('pause', () => {
      if (isPlayingRef.current) {
        togglePlay()
      }
    })

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      switchToPrevTrack()
    })

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      switchToNextTrack()
    })

    // 清理函数
    return () => {
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.setActionHandler('previoustrack', null)
      navigator.mediaSession.setActionHandler('nexttrack', null)
    }
  }, [togglePlay, switchToPrevTrack, switchToNextTrack])

  // 监听系统媒体控制事件
  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    const handleAction = (action: string) => {
      switch (action) {
        case 'play':
        case 'pause':
          togglePlay()
          break
        case 'previoustrack':
          switchToPrevTrack()
          break
        case 'nexttrack':
          switchToNextTrack()
          break
      }
    }

    // 这些已经通过 setActionHandler 处理了
    // 但可以添加额外的事件监听

    return () => {}
  }, [togglePlay, switchToPrevTrack, switchToNextTrack])
}
