/**
 * 音频播放控制 Hook
 * 处理播放、暂停、曲目切换等逻辑
 */
/* eslint-disable react-hooks/exhaustive-deps */

import { useRef, useCallback, useEffect } from 'react'
import { useMusicStore } from '@/stores/musicStore'
import { toast } from 'sonner'
import { shouldUpdatePlayingStateOnPause } from '../audio/playbackStateUtils'

interface UseAudioPlaybackOptions {
  volume: number
  isMuted: boolean
  isPlaying: boolean
  readyToPlay: boolean
  userInteracted: boolean
  isTrackChanging: boolean
  playMode: 'none' | 'all' | 'one' | 'shuffle'
  setIsPlaying: (isPlaying: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setReadyToPlay: (ready: boolean) => void
  setAudioError: (error: string | null) => void
  setIsTrackChanging: (changing: boolean) => void
  setIsMuted: (isMuted: boolean) => void
  buildAudioUrl: (track: string) => string
  initAudioContext: (audioElement: HTMLAudioElement | null) => void
  gainNodeRef: React.MutableRefObject<GainNode | null>
  audioContextRef: React.MutableRefObject<AudioContext | null>
}

interface Track {
  path: string
}

export function useAudioPlayback(options: UseAudioPlaybackOptions) {
  const {
    volume,
    isMuted,
    isPlaying,
    readyToPlay,
    userInteracted,
    isTrackChanging,
    playMode,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setReadyToPlay,
    setAudioError,
    setIsTrackChanging,
    setIsMuted,
    buildAudioUrl,
    initAudioContext,
    gainNodeRef,
    audioContextRef,
  } = options

  const audioRef = useRef<HTMLAudioElement>(null)
  const wasPlayingBeforeHiddenRef = useRef(false)
  const { currentTrack, availableTracks, setCurrentTrack } = useMusicStore()

  // 设置音频源
  const setupMediaSource = useCallback(() => {
    if (!audioRef.current || !currentTrack) return

    try {
      const audioUrl = buildAudioUrl(currentTrack)

      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.src = audioUrl

      try {
        if (audioRef.current.dataset) {
          audioRef.current.dataset.trackSrc = audioUrl
        }
      } catch {
        // ignore
      }

      audioRef.current.volume = isMuted ? 0 : volume
      audioRef.current.muted = isMuted
      audioRef.current.load()

      setAudioError(null)
      setIsTrackChanging(true)
    } catch (err) {
      console.error('setupMediaSource: 设置音频源失败', err)
      setAudioError(`设置音频源失败: ${err}`)
      toast.error('音频源设置失败', { description: String(err) })
    }
  }, [currentTrack, buildAudioUrl, setAudioError, setIsTrackChanging, isMuted, volume])

  // 监听 currentTrack 变化
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return

    const desiredUrl = buildAudioUrl(currentTrack)
    let currentMarkedSrc: string | null = null

    try {
      currentMarkedSrc = audioRef.current.dataset?.trackSrc ?? null
    } catch {
      currentMarkedSrc = null
    }

    const currentElementSrc = audioRef.current.src
    const isSameByMark = currentMarkedSrc === desiredUrl
    const isSameByElement = !!currentElementSrc && currentElementSrc === desiredUrl

    if (!isSameByMark && !isSameByElement) {
      setupMediaSource()
    }
  }, [currentTrack, buildAudioUrl, setupMediaSource])

  // 处理播放/暂停
  useEffect(() => {
    if (!audioRef.current) return

    const playAudio = async () => {
      if (!audioContextRef.current && audioRef.current && audioRef.current.src) {
        try {
          initAudioContext(audioRef.current)
          await new Promise(resolve => setTimeout(resolve, 50))

          const ctx = audioContextRef.current as AudioContext | null
          if (ctx && ctx.state === 'suspended') {
            await ctx.resume()
          }

          if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = isMuted ? 0 : volume
          }

          if (audioRef.current) {
            await audioRef.current.play()
          }
        } catch (err) {
          console.error('初始化 AudioContext 失败:', err)
          if (audioRef.current) {
            audioRef.current.play().catch(handlePlayError)
          }
        }
        return
      }

      if (audioContextRef.current) {
        if (audioContextRef.current.state === 'suspended') {
          try {
            await audioContextRef.current.resume()
          } catch (err) {
            console.warn('AudioContext resume 失败:', err)
          }
        }

        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = isMuted ? 0 : volume
        }
      }

      if (audioRef.current) {
        audioRef.current.play().catch(handlePlayError)
      }
    }

    // 错误处理函数
    const handlePlayError = (err: Error) => {
      setAudioError(`播放失败: ${err.message}`)
    }

    if (isPlaying && readyToPlay && userInteracted) {
      playAudio()
    } else if (!isPlaying) {
      audioRef.current.pause()
    }
  }, [
    isPlaying,
    userInteracted,
    readyToPlay,
    isMuted,
    volume,
    initAudioContext,
    setAudioError,
    gainNodeRef,
    audioContextRef,
  ])

  // 切换播放/暂停
  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return

    if (!availableTracks || availableTracks.length === 0) {
      setAudioError('播放列表为空，没有可播放的音乐')
      toast.error('播放列表为空', { description: '请先添加音乐文件到播放列表' })
      return
    }

    if (!audioRef.current.src) {
      setupMediaSource()
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(err => setAudioError(`播放失败: ${err.message}`))
      setIsPlaying(true)
    }
  }, [currentTrack, isPlaying, setupMediaSource, setIsPlaying, setAudioError, availableTracks])

  // 切换曲目
  const switchTrack = useCallback(
    (direction: 'next' | 'prev') => {
      if (!currentTrack || !availableTracks.length) {
        if (availableTracks.length === 0) {
          setAudioError('播放列表为空，没有可播放的音乐')
        }
        return
      }

      audioRef.current?.pause()

      const currentIndex = availableTracks.findIndex((track: Track) => track.path === currentTrack)
      let nextIndex = -1

      if (playMode === 'shuffle') {
        if (direction === 'next') {
          let randomIndex
          do {
            randomIndex = Math.floor(Math.random() * availableTracks.length)
          } while (randomIndex === currentIndex && availableTracks.length > 1)
          nextIndex = randomIndex
        } else {
          let randomIndex
          do {
            randomIndex = Math.floor(Math.random() * availableTracks.length)
          } while (randomIndex === currentIndex && availableTracks.length > 1)
          nextIndex = randomIndex
        }
      } else {
        if (direction === 'next') {
          nextIndex = (currentIndex + 1) % availableTracks.length
        } else {
          nextIndex = (currentIndex - 1 + availableTracks.length) % availableTracks.length
        }
      }

      setCurrentTrack(availableTracks[nextIndex].path)
      setAudioError(null)
      setIsPlaying(true)
      setupMediaSource()
    },
    [
      currentTrack,
      availableTracks,
      playMode,
      setCurrentTrack,
      setAudioError,
      setIsPlaying,
      setupMediaSource,
    ]
  )

  // 处理进度变化
  const handleProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = parseFloat(e.target.value)
      setCurrentTime(newTime)
      if (audioRef.current) {
        audioRef.current.currentTime = newTime
      }
    },
    [setCurrentTime]
  )

  // 同步音量
  useEffect(() => {
    const targetVolume = isMuted ? 0 : volume

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = targetVolume
    }

    if (audioRef.current) {
      if (gainNodeRef.current) {
        audioRef.current.volume = volume
        audioRef.current.muted = false
      } else {
        audioRef.current.volume = targetVolume
        audioRef.current.muted = isMuted
      }
    }
  }, [volume, isMuted, gainNodeRef])

  // 监听播放结束
  useEffect(() => {
    const audio = audioRef.current

    const handleAudioEnded = () => {
      setCurrentTime(0)
      switchTrack('next')
    }

    audio?.addEventListener('ended', handleAudioEnded)
    return () => audio?.removeEventListener('ended', handleAudioEnded)
  }, [setCurrentTime, switchTrack])

  // 同步真实播放状态
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => {
      const isDocumentHidden = typeof document !== 'undefined' && document.hidden
      if (
        shouldUpdatePlayingStateOnPause({
          isEnded: audio.ended,
          isDocumentHidden,
        })
      ) {
        setIsPlaying(false)
      }
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [setIsPlaying])

  // 页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!audioRef.current) return

      if (document.hidden) {
        wasPlayingBeforeHiddenRef.current = isPlaying || !audioRef.current.paused
        return
      }

      const shouldResumePlayback = wasPlayingBeforeHiddenRef.current || isPlaying
      if (!shouldResumePlayback) return

      wasPlayingBeforeHiddenRef.current = false

      try {
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume()
        }
        await audioRef.current.play()
      } catch (err) {
        console.warn('恢复播放失败:', err)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isPlaying])

  // 静音切换

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)

    if (!audioRef.current) return

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = nextMuted ? 0 : volume
      audioRef.current.volume = volume
      audioRef.current.muted = false
      return
    }

    audioRef.current.volume = nextMuted ? 0 : volume
    audioRef.current.muted = nextMuted
  }, [isMuted, volume, setIsMuted])

  // 重置播放时间
  const resetCurrentTime = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }, [])

  return {
    audioRef,
    togglePlay,
    switchTrack,
    handleProgressChange,
    setupMediaSource,
    toggleMute,
    resetCurrentTime,
  }
}
