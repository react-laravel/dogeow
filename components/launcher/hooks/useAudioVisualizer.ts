/**
 * 音频可视化 Hook
 * 处理 Web Audio API 初始化和频谱分析
 */

import { useRef, useCallback, useState } from 'react'
import { isMobileDevice } from '../audio/utils'

interface UseAudioVisualizerOptions {
  volume: number
  isMuted: boolean
}

interface UseAudioVisualizerReturn {
  audioContextRef: React.MutableRefObject<AudioContext | null>
  analyserRef: React.MutableRefObject<AnalyserNode | null>
  sourceRef: React.MutableRefObject<MediaElementAudioSourceNode | null>
  gainNodeRef: React.MutableRefObject<GainNode | null>
  analyserNode: AnalyserNode | null
  initAudioContext: (audioElement: HTMLAudioElement | null) => void
}

export function useAudioVisualizer(options: UseAudioVisualizerOptions): UseAudioVisualizerReturn {
  const { volume, isMuted } = options

  const audioContextRef = useRef<AudioContext | null>(null)
  const shouldUseWebAudioRef = useRef<boolean | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)

  const shouldUseWebAudio = useCallback(() => {
    if (shouldUseWebAudioRef.current !== null) {
      return shouldUseWebAudioRef.current
    }

    try {
      shouldUseWebAudioRef.current = !isMobileDevice()
    } catch {
      shouldUseWebAudioRef.current = true
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
        const source = audioContext.createMediaElementSource(audioElement)

        analyser.fftSize = 64
        analyser.smoothingTimeConstant = 0.8

        const currentVolume = isMuted ? 0 : volume
        gainNode.gain.value = currentVolume

        source.connect(analyser)
        analyser.connect(gainNode)
        gainNode.connect(audioContext.destination)

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
