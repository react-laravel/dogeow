import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import type { Direction } from '../utils/gameEngine'

/**
 * Direction rotation utilities
 */
const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left']

function getNextDirection(current: Direction, clockwise: boolean): Direction {
  const index = DIRECTIONS.indexOf(current)
  const next = (index + (clockwise ? 1 : 3)) % 4
  return DIRECTIONS[next]
}

function getRandomDirection(): Direction {
  return DIRECTIONS[Math.floor(Math.random() * 4)]
}

interface UseAutoPlayOptions {
  onMove: (direction: Direction) => void
  speed?: number
  enabled?: boolean
}

interface UseAutoPlayState {
  isRunning: boolean
  isDirectional: boolean
  isClockwise: boolean
  currentDirection: Direction
  speed: number
}

/**
 * Hook for auto-play functionality in 2048
 * Supports three modes:
 * - Random: Move in random directions
 * - Clockwise: Rotate direction clockwise each move
 * - Counter-clockwise: Rotate direction counter-clockwise each move
 *
 * Usage:
 * ```tsx
 * const {
 *   isRunning,
 *   speed,
 *   changeSpeed,
 *   startRandom,
 *   startDirectional,
 *   stop,
 * } = useAutoPlay({ onMove: handleMove })
 *
 * return (
 *   <>
 *     <button onClick={() => startRandom()}>Random</button>
 *     <button onClick={() => startDirectional(true)}>Clockwise</button>
 *     <button onClick={() => startDirectional(false)}>Counter-CW</button>
 *     <button onClick={() => stop()}>Stop</button>
 *     <select value={speed} onChange={(e) => changeSpeed(Number(e.target.value))}>
 *       <option value={200}>Fast</option>
 *       <option value={500}>Normal</option>
 *       <option value={1000}>Slow</option>
 *     </select>
 *   </>
 * )
 * ```
 */
export function useAutoPlay({
  onMove,
  speed: initialSpeed = 500,
  enabled = true,
}: UseAutoPlayOptions) {
  const [isRunning, setIsRunning] = useState(false)
  const [isDirectional, setIsDirectional] = useState(false)
  const [isClockwise, setIsClockwise] = useState(true)
  const [currentDirection, setCurrentDirection] = useState<Direction>('down')
  const [speed, setSpeed] = useState(initialSpeed)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Stop auto-play
   */
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsRunning(false)
    setIsDirectional(false)
  }, [])

  /**
   * Start random auto-play
   */
  const startRandom = useCallback(() => {
    stop()

    intervalRef.current = setInterval(() => {
      onMove(getRandomDirection())
    }, speed)

    setIsRunning(true)
    setIsDirectional(false)
    toast.success('Random auto-play started')
  }, [speed, onMove, stop])

  /**
   * Start directional auto-play (clockwise or counter-clockwise)
   */
  const startDirectional = useCallback(
    (clockwise: boolean) => {
      stop()

      intervalRef.current = setInterval(() => {
        setCurrentDirection(prev => {
          const next = getNextDirection(prev, clockwise)
          onMove(next)
          return next
        })
      }, speed)

      setIsRunning(true)
      setIsDirectional(true)
      setIsClockwise(clockwise)
      toast.success(`${clockwise ? 'Clockwise' : 'Counter-clockwise'} auto-play started`)
    },
    [speed, onMove, stop]
  )

  /**
   * Change speed and restart if running
   */
  const changeSpeed = useCallback(
    (newSpeed: number) => {
      setSpeed(newSpeed)

      // Restart with new speed if currently running
      if (isRunning) {
        if (isDirectional) {
          startDirectional(isClockwise)
        } else {
          startRandom()
        }
      }
    },
    [isRunning, isDirectional, isClockwise, startRandom, startDirectional]
  )

  /**
   * Toggle random auto-play
   */
  const toggleRandom = useCallback(() => {
    if (isRunning && !isDirectional) {
      stop()
      toast.success('Random auto-play stopped')
    } else {
      startRandom()
    }
  }, [isRunning, isDirectional, stop, startRandom])

  /**
   * Toggle clockwise auto-play
   */
  const toggleClockwise = useCallback(() => {
    if (isRunning && isClockwise) {
      stop()
      toast.success('Clockwise auto-play stopped')
    } else {
      startDirectional(true)
    }
  }, [isRunning, isClockwise, stop, startDirectional])

  /**
   * Toggle counter-clockwise auto-play
   */
  const toggleCounterClockwise = useCallback(() => {
    if (isRunning && !isClockwise) {
      stop()
      toast.success('Counter-clockwise auto-play stopped')
    } else {
      startDirectional(false)
    }
  }, [isRunning, isClockwise, stop, startDirectional])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  if (!enabled) {
    return {
      isRunning: false,
      isDirectional: false,
      isClockwise: false,
      currentDirection: 'down',
      speed,
      changeSpeed: () => {},
      startRandom: () => {},
      startDirectional: () => {},
      stop: () => {},
      toggleRandom: () => {},
      toggleClockwise: () => {},
      toggleCounterClockwise: () => {},
    }
  }

  return {
    isRunning,
    isDirectional,
    isClockwise,
    currentDirection,
    speed,
    changeSpeed,
    startRandom,
    startDirectional,
    stop,
    toggleRandom,
    toggleClockwise,
    toggleCounterClockwise,
  }
}
