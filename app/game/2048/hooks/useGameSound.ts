import { useRef, useCallback, useEffect, useState } from 'react'
import { logger } from '@/lib/logger'

export interface UseSoundOptions {
  /**
   * Frequency start (Hz)
   * @default 700
   */
  frequencyStart?: number

  /**
   * Frequency end (Hz)
   * @default 500
   */
  frequencyEnd?: number

  /**
   * Sound duration (seconds)
   * @default 0.12
   */
  duration?: number

  /**
   * Volume (0-1)
   * @default 0.12
   */
  volume?: number
}

/**
 * Hook for game sound effects using Web Audio API
 * Creates a simple beep sound on demand
 *
 * Usage:
 * ```tsx
 * const { playSound, isSupported } = useGameSound({
 *   frequencyStart: 700,
 *   frequencyEnd: 500,
 *   duration: 0.12,
 *   volume: 0.12,
 * })
 *
 * return (
 *   <button
 *     onClick={() => playSound()}
 *     disabled={!isSupported}
 *   >
 *     Play Sound
 *   </button>
 * )
 * ```
 */
export function useGameSound({
  frequencyStart = 700,
  frequencyEnd = 500,
  duration = 0.12,
  volume = 0.12,
}: UseSoundOptions = {}) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const isInitializedRef = useRef(false)
  const [isInitialized, setIsInitialized] = useState(false)

  /**
   * Initialize Web Audio API context
   * Must be called after user interaction due to browser policies
   */
  const initialize = useCallback(() => {
    if (isInitializedRef.current || typeof window === 'undefined') return

    const AudioCtx =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) {
      logger.debug('useGameSound: Web Audio API not supported')
      return
    }

    try {
      audioContextRef.current = new AudioCtx()
      isInitializedRef.current = true
      setIsInitialized(true)
      logger.debug('useGameSound: Initialized')
    } catch (error) {
      logger.error('useGameSound: Failed to initialize', error)
    }
  }, [])

  /**
   * Resume suspended audio context if needed
   * Some browsers suspend context until user interaction
   */
  const resume = useCallback(async () => {
    const ctx = audioContextRef.current
    if (!ctx) return

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
        logger.debug('useGameSound: Context resumed')
      } catch (error) {
        logger.error('useGameSound: Failed to resume context', error)
      }
    }
  }, [])

  /**
   * Play sound effect
   * Frequency ramps down from start to end, volume fades out
   */
  const playSound = useCallback(async () => {
    if (!isInitializedRef.current) {
      initialize()
    }

    const ctx = audioContextRef.current
    if (!ctx) return

    // Resume context if suspended
    if (ctx.state === 'suspended') {
      await resume()
    }

    try {
      // Create oscillator (tone generator)
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      // Connect: Oscillator -> Gain -> Speaker
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      // Set frequency envelope (descending)
      oscillator.frequency.setValueAtTime(frequencyStart, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(frequencyEnd, ctx.currentTime + duration)

      // Set volume envelope (fading out)
      gainNode.gain.setValueAtTime(volume, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + duration)

      // Play sound
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)

      logger.debug('useGameSound: Played sound', { duration, frequencyStart, frequencyEnd })
    } catch (error) {
      logger.error('useGameSound: Failed to play sound', error)
    }
  }, [initialize, resume, frequencyStart, frequencyEnd, duration, volume])

  /**
   * Unlock audio on first user interaction
   * Required by some browsers before audio can be played
   */
  useEffect(() => {
    if (typeof window === 'undefined') return

    const unlock = () => {
      initialize()
      resume()
    }

    // Listen for first user interaction
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    window.addEventListener('touchstart', unlock, { once: true })

    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [initialize, resume])

  return {
    playSound,
    isSupported:
      typeof window !== 'undefined' &&
      Boolean(
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      ),
    isInitialized,
  }
}
