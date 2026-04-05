/**
 * 音频可视化 Hook
 * 处理 Web Audio API 初始化和频谱分析
 */

import { useRef, useCallback, useState } from 'react'
import { logger } from '@/lib/logger'

type VisualizerSourceNode = MediaElementAudioSourceNode | MediaStreamAudioSourceNode

interface UseAudioVisualizerOptions {
  volume: number
  isMuted: boolean
}

interface UseAudioVisualizerReturn {
  audioContextRef: React.MutableRefObject<AudioContext | null>
  analyserRef: React.MutableRefObject<AnalyserNode | null>
  sourceRef: React.MutableRefObject<AudioNode | null>
  gainNodeRef: React.MutableRefObject<GainNode | null>
  analyserNode: AnalyserNode | null
  initAudioContext: (audioElement: HTMLAudioElement | null) => void
}

export function useAudioVisualizer(options: UseAudioVisualizerOptions): UseAudioVisualizerReturn {
  const { volume, isMuted } = options

  const audioContextRef = useRef<AudioContext | null>(null)
  const shouldUseWebAudioRef = useRef<boolean | null>(null)
  const shouldPreserveNativePlaybackRef = useRef<boolean | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<AudioNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)

  const shouldUseWebAudio = useCallback(() => {
    if (shouldUseWebAudioRef.current !== null) {
      return shouldUseWebAudioRef.current
    }

    // 现代浏览器（包括移动端）都支持 Web Audio API
    // 不再禁用移动设备的可视化功能
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      shouldUseWebAudioRef.current = !!AudioContextClass
    } catch {
      shouldUseWebAudioRef.current = false
    }

    return shouldUseWebAudioRef.current
  }, [])

  const shouldPreserveNativePlayback = useCallback(() => {
    if (shouldPreserveNativePlaybackRef.current !== null) {
      return shouldPreserveNativePlaybackRef.current
    }

    try {
      const userAgent = navigator.userAgent
      const platform = navigator.platform
      const maxTouchPoints = navigator.maxTouchPoints ?? 0
      const isIOSDevice =
        /iPad|iPhone|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)

      shouldPreserveNativePlaybackRef.current = isIOSDevice
    } catch {
      shouldPreserveNativePlaybackRef.current = false
    }

    return shouldPreserveNativePlaybackRef.current
  }, [])

  const createSourceNode = useCallback(
    (
      audioContext: AudioContext,
      audioElement: HTMLAudioElement
    ): { source: VisualizerSourceNode; usesNativeAudioOutput: boolean } | null => {
      const mediaElement = audioElement as HTMLMediaElement & {
        captureStream?: () => MediaStream
        mozCaptureStream?: () => MediaStream
      }
      const captureStream =
        typeof mediaElement.captureStream === 'function'
          ? mediaElement.captureStream.bind(mediaElement)
          : typeof mediaElement.mozCaptureStream === 'function'
            ? mediaElement.mozCaptureStream.bind(mediaElement)
            : null

      if (captureStream) {
        try {
          const stream = captureStream()

          if (stream.getAudioTracks().length > 0) {
            return {
              source: audioContext.createMediaStreamSource(stream),
              usesNativeAudioOutput: true,
            }
          }

          logger.warn('captureStream() 暂未提供音轨，等待播放开始后重试可视化初始化')
        } catch (error) {
          logger.warn('captureStream() 初始化失败:', error)
        }
      }

      // iPhone / iPad 上如果回退到 createMediaElementSource，播放会重新路由进 Web Audio，
      // 锁屏和切后台时容易再次被系统挂起。这里优先保留原生播放，再由 UI 做可视化降级。
      if (shouldPreserveNativePlayback()) {
        return null
      }

      return {
        source: audioContext.createMediaElementSource(audioElement),
        usesNativeAudioOutput: false,
      }
    },
    [shouldPreserveNativePlayback]
  )

  const initAudioContext = useCallback(
    (audioElement: HTMLAudioElement | null) => {
      if (!audioElement || audioContextRef.current) return
      if (!shouldUseWebAudio()) return

      let audioContext: AudioContext | null = null

      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

        if (!AudioContextClass) {
          return
        }

        audioContext = new AudioContextClass()
        const analyser = audioContext.createAnalyser()
        const gainNode = audioContext.createGain()
        const sourceResult = createSourceNode(audioContext, audioElement)

        if (!sourceResult) {
          void audioContext.close().catch(() => {})
          return
        }

        const { source, usesNativeAudioOutput } = sourceResult

        analyser.fftSize = 64
        analyser.smoothingTimeConstant = 0.8

        source.connect(analyser)
        gainNode.gain.value = usesNativeAudioOutput ? (isMuted ? 0 : volume) : 1

        if (!usesNativeAudioOutput) {
          analyser.connect(gainNode)
          gainNode.connect(audioContext.destination)
        }

        audioContextRef.current = audioContext
        analyserRef.current = analyser
        sourceRef.current = source
        gainNodeRef.current = gainNode
        setAnalyserNode(analyser)

        if (audioContext.state === 'suspended') {
          audioContext.resume().catch(err => {
            logger.warn('AudioContext resume 失败:', err)
          })
        }
      } catch (error) {
        if (audioContext) {
          void audioContext.close().catch(() => {})
        }
        logger.warn('Web Audio API 初始化失败:', error)
      }
    },
    [createSourceNode, isMuted, volume, shouldUseWebAudio]
  )

  return {
    audioContextRef,
    analyserRef,
    sourceRef,
    gainNodeRef,
    analyserNode,
    initAudioContext,
  }
}
