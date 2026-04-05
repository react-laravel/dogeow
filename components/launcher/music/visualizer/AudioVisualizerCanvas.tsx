'use client'

import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/helpers'
import type { AudioVisualizerProps, VisualizerType } from './types'
import { drawBarSingle, drawBars, drawBars6 } from './drawBars'
import { drawWave, drawWaveformHistory } from './drawWave'
import { drawSpectrum } from './drawSpectrum'
import { drawParticles, drawSilk } from './drawAmbient'

const MAX_HISTORY_LENGTH = 200
const MIN_FALLBACK_BIN_COUNT = 64

function fillFallbackFrequencyData(dataArray: Uint8Array, timestamp: number) {
  const time = timestamp / 1000
  const beat = (Math.sin(time * 2.4) + 1) / 2
  const sweep = (Math.sin(time * 0.65) + 1) / 2

  for (let index = 0; index < dataArray.length; index += 1) {
    const position = index / Math.max(1, dataArray.length - 1)
    const lowBoost = 1 - position * 0.72
    const pulse = (Math.sin(time * 4.5 + position * 10) + 1) / 2
    const shimmer = (Math.sin(time * 7.8 - position * 18) + 1) / 2
    const energy = 0.14 + pulse * 0.34 + shimmer * 0.2 + beat * 0.18
    const value = 255 * energy * lowBoost * (0.7 + sweep * 0.3)

    dataArray[index] = Math.max(12, Math.min(255, Math.round(value)))
  }
}

export const AudioVisualizerCanvas: React.FC<AudioVisualizerProps> = ({
  analyserNode,
  isPlaying,
  type = 'bars6',
  className,
  barCount = 32,
  barWidth = 3,
  barGap = 2,
  barColor = '#3b82f6',
  showGradient = true,
  fitWidth = false,
  barFillRatio = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const prevTypeRef = useRef<VisualizerType>(type)
  const waveformHistoryRef = useRef<number[][]>([])
  const particlesRef = useRef<
    Array<{ x: number; y: number; z: number; prevX: number; prevY: number }>
  >([])
  const silkPointsRef = useRef<
    Array<{
      x: number
      y: number
      len: number
      speed: number
      alpha: number
      hue: number
      vx?: number
      seed?: number
    }>
  >([])
  const spectrumSmoothedRef = useRef<Float32Array | null>(null)

  useEffect(() => {
    const binCount = analyserNode
      ? analyserNode.frequencyBinCount
      : Math.max(MIN_FALLBACK_BIN_COUNT, barCount * 2)

    dataArrayRef.current = new Uint8Array(binCount)
  }, [analyserNode, barCount])

  useEffect(() => {
    const draw = () => {
      if (!canvasRef.current || !dataArrayRef.current) return

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const displayWidth = Math.ceil(rect.width)
      const displayHeight = Math.ceil(rect.height)

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr
        canvas.height = displayHeight * dpr
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)
      }

      const width = displayWidth
      const height = displayHeight
      const dataArray = dataArrayRef.current

      if (analyserNode) {
        analyserNode.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>)
      } else {
        fillFallbackFrequencyData(dataArray, performance.now())
      }

      if (prevTypeRef.current !== type) {
        ctx.clearRect(0, 0, width, height)
        prevTypeRef.current = type
      }

      switch (type) {
        case 'bars':
          drawBars(ctx, dataArray, width, height, {
            barCount,
            barWidth,
            barGap,
            barColor,
            showGradient,
            fitWidth,
            barFillRatio,
          })
          break
        case 'bars6':
          drawBars6(ctx, dataArray, width, height)
          break
        case 'barSingle':
          drawBarSingle(ctx, dataArray, width, height)
          break
        case 'spectrum':
          drawSpectrum(ctx, dataArray, width, height, spectrumSmoothedRef)
          break
        case 'waveform':
          drawWaveformHistory(ctx, dataArray, width, height, waveformHistoryRef, MAX_HISTORY_LENGTH)
          break
        case 'particles':
          drawParticles(ctx, dataArray, width, height, particlesRef)
          break
        case 'silk':
          drawSilk(ctx, dataArray, width, height, silkPointsRef, canvasRef.current)
          break
        default:
          drawWave(ctx, dataArray, width, height)
          break
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(draw)
      }
    }

    if (isPlaying) {
      draw()
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [
    analyserNode,
    barColor,
    barCount,
    barFillRatio,
    barGap,
    barWidth,
    fitWidth,
    isPlaying,
    showGradient,
    type,
  ])

  return (
    <canvas
      ref={canvasRef}
      className={cn('h-full w-full', className)}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
