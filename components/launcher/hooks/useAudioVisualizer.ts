/**
 * 音频可视化 Hook
 * 处理 Web Audio API 初始化和频谱分析
 */

import { useRef, useCallback, useState, useEffect } from 'react'
import type { AudioPlaybackMode } from '@/stores/musicStore'
import type { AudioVisualizerSourceNode } from './types'

interface UseAudioVisualizerOptions {
  volume: number
  isMuted: boolean
  playbackMode: AudioPlaybackMode
}

interface UseAudioVisualizerReturn {
  audioContextRef: React.MutableRefObject<AudioContext | null>
  analyserRef: React.MutableRefObject<AnalyserNode | null>
  sourceRef: React.MutableRefObject<AudioVisualizerSourceNode | null>
  gainNodeRef: React.MutableRefObject<GainNode | null>
  analyserNode: AnalyserNode | null
  initAudioContext: (audioElement: HTMLAudioElement | null) => void
  teardownAudioContext: () => boolean
  routesPlaybackThroughWebAudio: () => boolean
}

interface AudioSourceSetup {
  source: AudioVisualizerSourceNode
  shouldRouteToDestination: boolean
}

function supportsCaptureStream(audioElement: HTMLAudioElement): boolean {
  const elementWithCaptureStream = audioElement as HTMLMediaElement & {
    captureStream?: () => MediaStream
  }

  return typeof elementWithCaptureStream.captureStream === 'function'
}

function isIOSLikeBrowser(): boolean {
  const platform = navigator.platform ?? ''
  const userAgent = navigator.userAgent ?? ''
  const maxTouchPoints = navigator.maxTouchPoints ?? 0

  return /iPad|iPhone|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
}

function shouldBypassWebAudio(
  audioElement: HTMLAudioElement,
  playbackMode: AudioPlaybackMode
): boolean {
  if (playbackMode === 'native') {
    return true
  }

  if (playbackMode === 'visualizer') {
    return false
  }

  return isIOSLikeBrowser() && !supportsCaptureStream(audioElement)
}

function getAudioContextClass(): typeof AudioContext | undefined {
  const win = window as typeof window & { webkitAudioContext?: typeof AudioContext }
  return win.AudioContext ?? win.webkitAudioContext
}

function createVisualizerSource(
  audioContext: AudioContext,
  audioElement: HTMLAudioElement
): AudioSourceSetup {
  const elementWithCaptureStream = audioElement as HTMLMediaElement & {
    captureStream?: () => MediaStream
  }
  const captureStream = elementWithCaptureStream.captureStream

  if (typeof captureStream === 'function') {
    try {
      const stream = captureStream.call(elementWithCaptureStream)

      return {
        source: audioContext.createMediaStreamSource(stream),
        shouldRouteToDestination: false,
      }
    } catch (error) {
      console.warn('captureStream 初始化失败，切换到 MediaElementAudioSource:', error)
    }
  }

  return {
    source: audioContext.createMediaElementSource(audioElement),
    shouldRouteToDestination: true,
  }
}

export function useAudioVisualizer(options: UseAudioVisualizerOptions): UseAudioVisualizerReturn {
  const { isMuted, playbackMode } = options

  const audioContextRef = useRef<AudioContext | null>(null)
  const shouldUseWebAudioRef = useRef<boolean | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<AudioVisualizerSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  // 仅当播放音频经由 AudioContext 路由到扬声器时为 true（createMediaElementSource 路径）。
  // captureStream 路径下声音由 <audio> 元素直接输出，AudioContext 只做频谱分析。
  const routesPlaybackRef = useRef(false)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)

  const shouldUseWebAudio = useCallback(() => {
    if (shouldUseWebAudioRef.current !== null) {
      return shouldUseWebAudioRef.current
    }

    // 现代浏览器（包括移动端）都支持 Web Audio API
    // 不再禁用移动设备的可视化功能
    try {
      const AudioContextClass = getAudioContextClass()
      shouldUseWebAudioRef.current = !!AudioContextClass
    } catch {
      shouldUseWebAudioRef.current = false
    }

    return shouldUseWebAudioRef.current
  }, [])

  const initAudioContext = useCallback(
    (audioElement: HTMLAudioElement | null) => {
      if (!audioElement || audioContextRef.current) return
      if (shouldBypassWebAudio(audioElement, playbackMode)) {
        return
      }
      if (!shouldUseWebAudio()) return

      try {
        const AudioContextClass = getAudioContextClass()

        if (!AudioContextClass) {
          return
        }

        const audioContext = new AudioContextClass()
        const analyser = audioContext.createAnalyser()
        const gainNode = audioContext.createGain()
        const { source, shouldRouteToDestination } = createVisualizerSource(
          audioContext,
          audioElement
        )

        analyser.fftSize = 64
        analyser.smoothingTimeConstant = 0.8

        source.connect(analyser)
        if (shouldRouteToDestination) {
          analyser.connect(gainNode)
          gainNode.connect(audioContext.destination)
        }
        routesPlaybackRef.current = shouldRouteToDestination

        gainNode.gain.value = isMuted ? 0 : 1

        audioContextRef.current = audioContext
        analyserRef.current = analyser
        sourceRef.current = source
        gainNodeRef.current = gainNode
        setAnalyserNode(analyser)

        if (audioContext.state !== 'running') {
          audioContext.resume().catch(err => {
            console.warn('AudioContext resume 失败:', err)
          })
        }
      } catch (error) {
        console.warn('Web Audio API 初始化失败:', error)
      }
    },
    [isMuted, playbackMode, shouldUseWebAudio]
  )

  const teardownAudioContext = useCallback((): boolean => {
    const wasRoutingPlayback = routesPlaybackRef.current
    const audioContext = audioContextRef.current

    if (!audioContext) {
      return wasRoutingPlayback
    }

    try {
      sourceRef.current?.disconnect()
      analyserRef.current?.disconnect()
      gainNodeRef.current?.disconnect()
    } catch {
      // ignore disconnect errors during teardown
    }

    if (audioContext.state !== 'closed') {
      void audioContext.close().catch(err => {
        console.warn('AudioContext close 失败:', err)
      })
    }

    audioContextRef.current = null
    analyserRef.current = null
    sourceRef.current = null
    gainNodeRef.current = null
    routesPlaybackRef.current = false
    setAnalyserNode(null)

    return wasRoutingPlayback
  }, [])

  const routesPlaybackThroughWebAudio = useCallback(() => routesPlaybackRef.current, [])

  // 锁屏/切后台时挂起“仅用于分析”的 AudioContext，解锁后再恢复。
  //
  // 仅在 captureStream 路径（routesPlaybackRef.current === false）生效：此路径下
  // 声音由 <audio> 元素直接输出，挂起 AudioContext 不会中断播放，但能在锁屏期间
  // 释放 Web Audio 占用的音频会话，避免移动端系统在“中断→恢复”循环中把音频
  // 切到降级（低/沉闷）的输出通道。
  //
  // createMediaElementSource 路径（routesPlaybackRef.current === true）下播放依赖
  // AudioContext，此处绝不挂起，否则会直接静音。
  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleVisibilityChange = () => {
      const audioContext = audioContextRef.current
      if (!audioContext || routesPlaybackRef.current) return

      if (document.hidden) {
        if (audioContext.state === 'running') {
          audioContext.suspend().catch(err => {
            console.warn('AudioContext suspend 失败:', err)
          })
        }
        return
      }

      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(err => {
          console.warn('AudioContext resume 失败:', err)
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return {
    audioContextRef,
    analyserRef,
    sourceRef,
    gainNodeRef,
    analyserNode,
    initAudioContext,
    teardownAudioContext,
    routesPlaybackThroughWebAudio,
  }
}
