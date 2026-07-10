import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { Direction } from '../utils/gameEngine'

const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left']

type AutoPlayMode = 'idle' | 'random' | 'clockwise' | 'counter-clockwise'

function getNextDirection(current: Direction, clockwise: boolean): Direction {
  const index = DIRECTIONS.indexOf(current)
  return DIRECTIONS[(index + (clockwise ? 1 : 3)) % 4]
}

function getRandomDirection(): Direction {
  return DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
}

interface UseAutoPlayOptions {
  onMove: (direction: Direction) => void
  speed?: number
  enabled?: boolean
}

/**
 * Owns all interval lifecycle and mode transitions for 2048 auto-play.
 * The latest onMove callback is read from a ref so a running interval never
 * holds stale game state.
 */
export function useAutoPlay({
  onMove,
  speed: initialSpeed = 500,
  enabled = true,
}: UseAutoPlayOptions) {
  const [mode, setMode] = useState<AutoPlayMode>('idle')
  const [isClockwise, setIsClockwise] = useState(true)
  const [currentDirection, setCurrentDirection] = useState<Direction>('down')
  const [speed, setSpeed] = useState(initialSpeed)
  const onMoveRef = useRef(onMove)

  useEffect(() => {
    onMoveRef.current = onMove
  }, [onMove])

  useEffect(() => {
    if (!enabled || mode === 'idle') return

    const interval = setInterval(() => {
      if (mode === 'random') {
        onMoveRef.current(getRandomDirection())
        return
      }

      const clockwise = mode === 'clockwise'
      setCurrentDirection(current => {
        const nextDirection = getNextDirection(current, clockwise)
        onMoveRef.current(nextDirection)
        return nextDirection
      })
    }, speed)

    return () => clearInterval(interval)
  }, [enabled, mode, speed])

  const stop = useCallback(() => {
    setMode('idle')
  }, [])

  const startRandom = useCallback(() => {
    if (!enabled) return

    setMode('random')
    toast.success('开始随机自动运行')
  }, [enabled])

  const startDirectional = useCallback(
    (clockwise: boolean) => {
      if (!enabled) return

      setIsClockwise(clockwise)
      setMode(clockwise ? 'clockwise' : 'counter-clockwise')
    },
    [enabled]
  )

  const changeSpeed = useCallback(
    (newSpeed: number) => {
      if (!enabled) return
      setSpeed(newSpeed)
    },
    [enabled]
  )

  const toggleRandom = useCallback(() => {
    if (mode === 'random') {
      stop()
      toast.success('已停止随机自动运行')
      return
    }

    startRandom()
  }, [mode, startRandom, stop])

  const toggleClockwise = useCallback(() => {
    if (mode === 'clockwise') {
      stop()
      return
    }

    startDirectional(true)
  }, [mode, startDirectional, stop])

  const toggleCounterClockwise = useCallback(() => {
    if (mode === 'counter-clockwise') {
      stop()
      return
    }

    startDirectional(false)
  }, [mode, startDirectional, stop])

  const reset = useCallback(() => {
    setMode('idle')
    setIsClockwise(true)
    setCurrentDirection('down')
    setSpeed(initialSpeed)
  }, [initialSpeed])

  const isRunning = enabled && mode !== 'idle'
  const isDirectional = enabled && (mode === 'clockwise' || mode === 'counter-clockwise')

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
    reset,
    toggleRandom,
    toggleClockwise,
    toggleCounterClockwise,
  }
}
