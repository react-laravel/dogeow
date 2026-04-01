/**
 * 音频可视化 Hook
 * 处理 Web Audio API 初始化和频谱分析
 */

import { useRef, useCallback, useState } from 'react'

interface UseAudioVisualizerOptions {
  volume: number
  isMuted: boolean
}

interface UseAudioVisualizerReturn {
  audioContextRef: React.MutableRefObject<AudioContext | null>
  analyserRef: React.MutableRefObject<AnalyserNode | null>
  sourceRef: React.MutableRefObject<MediaStreamAudioSourceNode | null>
  gainNodeRef: React.MutableRefObject<GainNode | null>
  analyserNode: AnalyserNode | null
  initAudioContext: (audioElement: HTMLAudioElement | null) => void
}

export function useAudioVisualizer(options: UseAudioVisualizerOptions): UseAudioVisualizerReturn {
  const { volume, isMuted } = options

  const audioContextRef = useRef<AudioContext | null>(null)
  const shouldUseWebAudioRef = useRef<boolean | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
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

  const initAudioContext = useCallback(
    (audioElement: HTMLAudioElement | null) => {
      if (!audioElement || audioContextRef.current) return
      if (!shouldUseWebAudio()) return

      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

        if (!AudioContextClass) {
          return
        }

        const audioContext = new AudioContextClass()
        const analyser = audioContext.createAnalyser()
        const gainNode = audioContext.createGain()

        // 使用 captureStream + MediaStreamSource 代替 createMediaElementSource
        // 这样音频元素可以独立播放（支持后台/锁屏播放），
        // 而 MediaStreamSource 仅用于频谱分析可视化
        const stream = (
          audioElement as HTMLMediaElement & { captureStream(): MediaStream }
        ).captureStream()
        const source = audioContext.createMediaStreamSource(stream)

        analyser.fftSize = 64
        analyser.smoothingTimeConstant = 0.8

        // 仅连接到 analyser 用于可视化，不连接到 destination
        // 音频输出由 audio 元素原生处理
        source.connect(analyser)

        gainNode.gain.value = isMuted ? 0 : volume

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
    [isMuted, volume, shouldUseWebAudio]
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
