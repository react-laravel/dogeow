import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import type { Direction } from '../utils/gameEngine'

export interface UseGyroscopeControlsOptions {
  onMove: (direction: Direction) => void
  threshold?: number
  throttleMs?: number
}

const DEFAULT_THRESHOLD = 25
const DEFAULT_THROTTLE_MS = 200

/**
 * Hook for gyroscope (device orientation) controls in 2048
 * Detects device rotation and maps to game directions
 *
 * Returns:
 * - isSupported: Whether device supports gyroscope
 * - isEnabled: Current gyroscope state
 * - toggle: Enable/disable gyroscope
 *
 * Usage:
 * ```tsx
 * const { isSupported, isEnabled, toggle } = useGyroscopeControls({
 *   onMove: handleMove,
 *   threshold: 25,
 * })
 *
 * return (
 *   <button
 *     disabled={!isSupported}
 *     onClick={toggle}
 *   >
 *     {isEnabled ? 'Disable' : 'Enable'} Gyro
 *   </button>
 * )
 * ```
 */
export function useGyroscopeControls({
  onMove,
  threshold = DEFAULT_THRESHOLD,
  throttleMs = DEFAULT_THROTTLE_MS,
}: UseGyroscopeControlsOptions) {
  const [isSupported, setIsSupported] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof DeviceOrientationEvent !== 'undefined' &&
      'ontouchstart' in window
  )
  const [isEnabled, setIsEnabled] = useState(false)
  const lastMoveTimeRef = useRef<number>(0)

  /**
   * Request permission for gyroscope access (iOS 13+)
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof DeviceOrientationEvent === 'undefined') {
      setIsSupported(false)
      return false
    }

    const DeviceOrientation = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }

    // iOS 13+ requires explicit permission request
    if (typeof DeviceOrientation.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientation.requestPermission()
        if (permission === 'granted') {
          setIsSupported(true)
          return true
        } else {
          toast.error('陀螺仪权限被拒绝')
          setIsSupported(false)
          return false
        }
      } catch (error) {
        toast.error('请求陀螺仪权限失败')
        setIsSupported(false)
        return false
      }
    }

    // Android and older iOS don't require explicit permission
    setIsSupported(true)
    return true
  }, [])

  /**
   * Toggle gyroscope control
   */
  const toggle = useCallback(async () => {
    if (!isEnabled) {
      // Enable gyroscope
      if (await requestPermission()) {
        setIsEnabled(true)
        toast.success('陀螺仪已启用')
      }
    } else {
      // Disable gyroscope
      setIsEnabled(false)
      toast.success('陀螺仪已关闭')
    }
  }, [isEnabled, requestPermission])

  /**
   * Listen for device orientation changes
   */
  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined') return

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      const now = Date.now()
      // Throttle moves to prevent excessive updates
      if (now - lastMoveTimeRef.current < throttleMs) return

      const { beta, gamma } = event
      if (beta == null || gamma == null) return

      // beta: front-to-back tilt (-180 to 180)
      // gamma: left-to-right tilt (-90 to 90)

      let direction: Direction | null = null

      // Determine primary axis of tilt
      if (Math.abs(gamma) > Math.abs(beta)) {
        // Horizontal tilt (left-right)
        if (gamma > threshold) {
          direction = 'right'
        } else if (gamma < -threshold) {
          direction = 'left'
        }
      } else {
        // Vertical tilt (forward-backward)
        if (beta > threshold) {
          direction = 'down'
        } else if (beta < -threshold) {
          direction = 'up'
        }
      }

      if (direction) {
        onMove(direction)
        lastMoveTimeRef.current = now
      }
    }

    window.addEventListener('deviceorientation', handleDeviceOrientation)

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation)
    }
  }, [isEnabled, onMove, threshold, throttleMs])

  return {
    isSupported,
    isEnabled,
    toggle,
  }
}
