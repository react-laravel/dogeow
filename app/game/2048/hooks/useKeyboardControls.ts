import { useEffect } from 'react'
import type { Direction } from '../utils/gameEngine'

export interface UseKeyboardControlsOptions {
  onMove: (direction: Direction) => void
  enabled?: boolean
}

/**
 * Hook for keyboard control in 2048
 * Maps arrow keys to game directions
 *
 * Usage:
 * ```tsx
 * useKeyboardControls({
 *   onMove: handleMove,
 *   enabled: !gameOver,
 * })
 * ```
 */
export function useKeyboardControls({ onMove, enabled = true }: UseKeyboardControlsOptions) {
  useEffect(() => {
    if (!enabled) return

    const handler = (e: KeyboardEvent) => {
      const directionMap: Record<string, Direction> = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
      }

      const direction = directionMap[e.key]
      if (direction) {
        e.preventDefault()
        onMove(direction)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onMove, enabled])
}
