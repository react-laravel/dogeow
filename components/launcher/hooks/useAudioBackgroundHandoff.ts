/**
 * 可视化优先 + MediaElement 路由时，用第二个隐藏 <audio> 做重叠接管。
 *
 * createMediaElementSource 会永久占用元素，不能把同一个元素临时切回原生播放。
 * 锁屏时先让 handoff <audio> 从同一进度开始播放，再拆 Web Audio 和 remount 主
 * <audio>；解锁时主 <audio> 重新接管并恢复可视化，最后停掉 handoff <audio>。
 */
import { useCallback, useEffect, useRef } from 'react'
import type { AudioPlaybackMode } from '@/stores/musicStore'
import {
  applyPlaybackSnapshotSync,
  capturePlaybackSnapshot,
  resumePlaybackFromSnapshot,
  type AudioPlaybackSnapshot,
} from '../audio/audioPlaybackSnapshot'

interface UseAudioBackgroundHandoffOptions {
  audioRef: React.RefObject<HTMLAudioElement | null>
  handoffAudioRef: React.RefObject<HTMLAudioElement | null>
  setAudioMountKey: React.Dispatch<React.SetStateAction<number>>
  playbackMode: AudioPlaybackMode
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setNativeHandoffActive: (active: boolean) => void
  teardownAudioContext: () => boolean
  initAudioContext: (audioElement: HTMLAudioElement | null) => void
  audioContextRef: React.MutableRefObject<AudioContext | null>
  routesPlaybackThroughWebAudio: () => boolean
}

export function useAudioBackgroundHandoff({
  audioRef,
  handoffAudioRef,
  setAudioMountKey,
  playbackMode,
  isPlaying,
  setIsPlaying,
  setCurrentTime,
  setNativeHandoffActive,
  teardownAudioContext,
  initAudioContext,
  audioContextRef,
  routesPlaybackThroughWebAudio,
}: UseAudioBackgroundHandoffOptions): void {
  const nativeHandoffActiveRef = useRef(false)
  const isTransitioningRef = useRef(false)

  const clearAudioElement = useCallback((audio: HTMLAudioElement | null) => {
    if (!audio) return

    audio.pause()
    audio.removeAttribute('src')
    try {
      delete audio.dataset.trackSrc
    } catch {
      // ignore
    }
    audio.load()
  }, [])

  const startFromSnapshot = useCallback(
    async (audio: HTMLAudioElement, snapshot: AudioPlaybackSnapshot) => {
      const needsSrcUpdate = applyPlaybackSnapshotSync(audio, snapshot)
      await resumePlaybackFromSnapshot(audio, snapshot, needsSrcUpdate)
      setCurrentTime(audio.currentTime)

      if (snapshot.wasPlaying) {
        setIsPlaying(true)
      }
    },
    [setCurrentTime, setIsPlaying]
  )

  const handoffToNativeAudio = useCallback(async () => {
    if (isTransitioningRef.current || nativeHandoffActiveRef.current) {
      return
    }

    const sourceAudio = audioRef.current
    const handoffAudio = handoffAudioRef.current

    if (!routesPlaybackThroughWebAudio() || !sourceAudio?.src || !handoffAudio) {
      return
    }

    const wasPlaying = isPlaying && !sourceAudio.paused
    const snapshot = capturePlaybackSnapshot(sourceAudio, wasPlaying)

    isTransitioningRef.current = true

    try {
      await startFromSnapshot(handoffAudio, snapshot)

      if (!teardownAudioContext()) {
        clearAudioElement(handoffAudio)
        return
      }

      sourceAudio.pause()
      nativeHandoffActiveRef.current = true
      setNativeHandoffActive(true)
      setAudioMountKey(key => key + 1)
    } catch (error) {
      console.warn('锁屏原生音频接管失败:', error)
      clearAudioElement(handoffAudio)
    } finally {
      isTransitioningRef.current = false
    }
  }, [
    audioRef,
    clearAudioElement,
    handoffAudioRef,
    isPlaying,
    routesPlaybackThroughWebAudio,
    setAudioMountKey,
    setNativeHandoffActive,
    startFromSnapshot,
    teardownAudioContext,
  ])

  const restoreVisualizerAudio = useCallback(async () => {
    if (isTransitioningRef.current || !nativeHandoffActiveRef.current) {
      return
    }

    const visualizerAudio = audioRef.current
    const handoffAudio = handoffAudioRef.current

    if (!visualizerAudio || !handoffAudio?.src) {
      nativeHandoffActiveRef.current = false
      setNativeHandoffActive(false)
      return
    }

    const snapshot = capturePlaybackSnapshot(handoffAudio, isPlaying && !handoffAudio.paused)

    isTransitioningRef.current = true

    try {
      const needsSrcUpdate = applyPlaybackSnapshotSync(visualizerAudio, snapshot)

      if (!audioContextRef.current) {
        initAudioContext(visualizerAudio)
      }

      await resumePlaybackFromSnapshot(visualizerAudio, snapshot, needsSrcUpdate)
      clearAudioElement(handoffAudio)
      setCurrentTime(visualizerAudio.currentTime)

      if (snapshot.wasPlaying) {
        setIsPlaying(true)
      }

      nativeHandoffActiveRef.current = false
      setNativeHandoffActive(false)
    } catch (error) {
      console.warn('可视化音频恢复失败:', error)
    } finally {
      isTransitioningRef.current = false
    }
  }, [
    audioContextRef,
    audioRef,
    clearAudioElement,
    handoffAudioRef,
    initAudioContext,
    isPlaying,
    setCurrentTime,
    setIsPlaying,
    setNativeHandoffActive,
  ])

  useEffect(() => {
    if (typeof document === 'undefined' || playbackMode !== 'visualizer') {
      return
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        void handoffToNativeAudio()
        return
      }

      void restoreVisualizerAudio()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [handoffToNativeAudio, playbackMode, restoreVisualizerAudio])
}
