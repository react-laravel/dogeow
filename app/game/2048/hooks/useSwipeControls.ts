import { useEffect, useRef } from 'react'
import type { Direction } from '../utils/gameEngine'

export interface UseSwipeControlsOptions {
  onMove: (direction: Direction) => void
  enabled?: boolean
  minDistance?: number
  throttleMs?: number
  targetSelector?: string
}

const DEFAULT_MIN_DISTANCE = 30
const DEFAULT_THROTTLE_MS = 200

/**
 * Hook for touch swipe controls in 2048
 * Detects swipe gestures and calls onMove with direction
 *
 * Usage:
 * ```tsx
 * useSwipeControls({
 *   onMove: handleMove,
 *   enabled: !gameOver && !isGyroEnabled,
 *   minDistance: 30,
 *   throttleMs: 200,
 *   targetSelector: '[data-game-board]', // Only swipe on game board
 * })
 * ```
 */
export function useSwipeControls({
  onMove,
  enabled = true,
  minDistance = DEFAULT_MIN_DISTANCE,
  throttleMs = DEFAULT_THROTTLE_MS,
  targetSelector = '[data-game-board]',
}: UseSwipeControlsOptions) {
  const stateRef = useRef({
    startX: 0,
    startY: 0,
    lastMoveTime: 0,
    touching: false,
  })

  useEffect(() => {
    if (!enabled) return

    const state = stateRef.current

    const onStart = (e: TouchEvent) => {
      // Only track swipes on the game board
      const target = e.target as HTMLElement
      state.touching = !!target.closest(targetSelector)

      if (state.touching) {
        state.startX = e.touches[0].clientX
        state.startY = e.touches[0].clientY
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!state.touching || !state.startX || !state.startY) return

      const now = Date.now()
      // Throttle moves
      if (now - state.lastMoveTime < throttleMs) return

      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY

      const diffX = state.startX - currentX
      const diffY = state.startY - currentY

      // Determine swipe direction (horizontal vs vertical)
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (Math.abs(diffX) > minDistance) {
          const direction: Direction = diffX > 0 ? 'left' : 'right'
          onMove(direction)
          // Update start position for next move
          state.startX = currentX
          state.startY = currentY
          state.lastMoveTime = now
        }
      } else if (Math.abs(diffY) > minDistance) {
        // Vertical swipe
        const direction: Direction = diffY > 0 ? 'up' : 'down'
        onMove(direction)
        // Update start position for next move
        state.startX = currentX
        state.startY = currentY
        state.lastMoveTime = now
      }
    }

    const onEnd = () => {
      state.startX = 0
      state.startY = 0
      state.lastMoveTime = 0
      state.touching = false
    }

    document.addEventListener('touchstart', onStart)
    document.addEventListener('touchmove', onTouchMove)
    document.addEventListener('touchend', onEnd)

    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onEnd)
    }
  }, [onMove, enabled, minDistance, throttleMs, targetSelector])
}
