/**
 * 音频可视化 Hook
 * 处理 Web Audio API 初始化和频谱分析
 */

import { useRef, useCallback, useState } from 'react'
import type { AudioVisualizerSourceNode } from './types'

interface UseAudioVisualizerOptions {
  volume: number
  isMuted: boolean
}

interface UseAudioVisualizerReturn {
  audioContextRef: React.MutableRefObject<AudioContext | null>
  analyserRef: React.MutableRefObject<AnalyserNode | null>
  sourceRef: React.MutableRefObject<AudioVisualizerSourceNode | null>
  gainNodeRef: React.MutableRefObject<GainNode | null>
  analyserNode: AnalyserNode | null
  initAudioContext: (audioElement: HTMLAudioElement | null) => void
}

interface AudioSourceSetup {
  source: AudioVisualizerSourceNode
  shouldRouteToDestination: boolean
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

  if (typeof elementWithCaptureStream.captureStream === 'function') {
    try {
      const stream = elementWithCaptureStream.captureStream()

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
  const { isMuted } = options

  const audioContextRef = useRef<AudioContext | null>(null)
  const shouldUseWebAudioRef = useRef<boolean | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<AudioVisualizerSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
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

        gainNode.gain.value = isMuted ? 0 : 1

        audioContextRef.current = audioContext
        analyserRef.current = analyser
        sourceRef.current = source
        gainNodeRef.current = gainNode
        setAnalyserNode(analyser)

        if (audioContext.state === 'suspended') {
          audioContext.resume().catch(err => {
            console.warn('AudioContext resume 失败:', err)
          })
        }
      } catch (error) {
        console.warn('Web Audio API 初始化失败:', error)
      }
    },
    [isMuted, shouldUseWebAudio]
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
