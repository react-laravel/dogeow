'use client'

import { useEffect, useCallback, useRef } from 'react'
import { logger } from '@/lib/logger'
import { useMazeStore } from '../store'
import { logger } from '@/lib/logger'
import MazeCanvas from './MazeCanvas'
import { logger } from '@/lib/logger'

export default function MazeGame() {
  const {
    moveToPosition,
    gameStarted,
    gameCompleted,
    isAutoMoving,
    mazeSize,
    moves,
    gameTime,
    startGame,
    resetGame,
  } = useMazeStore()

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 进入页面自动开始游戏
  useEffect(() => {
    if (!gameStarted) {
      startGame()
    }
  }, [gameStarted, startGame])

  // 将屏幕坐标转换为迷宫网格坐标
  const screenToMazeCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return null

      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()

      // 获取canvas内的相对坐标
      const x = clientX - rect.left
      const y = clientY - rect.top

      // 计算实际的迷宫渲染区域（与Canvas绘制逻辑保持一致）
      const canvasWidth = rect.width
      const canvasHeight = rect.height
      const cellSize = Math.min(canvasWidth, canvasHeight) / mazeSize
      const mazeRenderWidth = cellSize * mazeSize
      const mazeRenderHeight = cellSize * mazeSize

      // 计算迷宫在Canvas中的偏移（如果Canvas不是正方形）
      const offsetX = (canvasWidth - mazeRenderWidth) / 2
      const offsetY = (canvasHeight - mazeRenderHeight) / 2

      // 调整坐标到迷宫渲染区域
      const adjustedX = x - offsetX
      const adjustedY = y - offsetY

      // 转换为网格坐标
      const mazeX = Math.floor(adjustedX / cellSize)
      const mazeY = Math.floor(adjustedY / cellSize)

      // 如果调整后的坐标为负数，说明点击在迷宫区域外，返回null
      if (
        adjustedX < 0 ||
        adjustedY < 0 ||
        adjustedX >= mazeRenderWidth ||
        adjustedY >= mazeRenderHeight
      ) {
        return null
      }

      // 确保坐标在有效范围内
      const clampedX = Math.max(0, Math.min(mazeSize - 1, mazeX))
      const clampedY = Math.max(0, Math.min(mazeSize - 1, mazeY))

      logger.debug('🎯 坐标转换:', {
        click: { x: clientX, y: clientY },
        canvas: { x, y },
        canvasSize: { width: rect.width, height: rect.height },
        cellSize,
        mazeRender: { width: mazeRenderWidth, height: mazeRenderHeight },
        offset: { x: offsetX, y: offsetY },
        adjusted: { x: adjustedX, y: adjustedY },
        maze: { x: mazeX, y: mazeY },
        clamped: { x: clampedX, y: clampedY },
        mazeSize,
      })

      return { x: clampedX, y: clampedY }
    },
    [mazeSize]
  )

  // 处理画布点击
  const handleCanvasClick = useCallback(
    (event: MouseEvent) => {
      logger.debug('🖱️ 画布点击事件:', { gameStarted, gameCompleted })

      if (!gameStarted) {
        // 如果游戏未开始，点击开始游戏
        logger.debug('🎮 点击开始游戏')
        startGame()
        return
      }

      if (gameCompleted) {
        return
      }

      const coordinates = screenToMazeCoordinates(event.clientX, event.clientY)
      if (!coordinates) return

      logger.debug('🎯 点击坐标:', coordinates)
      moveToPosition(coordinates.x, coordinates.y)
    },
    [gameStarted, gameCompleted, screenToMazeCoordinates, moveToPosition, startGame]
  )

  // 处理触摸点击
  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (!gameStarted) {
        // 如果游戏未开始，点击开始游戏
        startGame()
        return
      }

      if (gameCompleted) {
        return
      }

      event.preventDefault()

      if (event.changedTouches.length > 0) {
        const touch = event.changedTouches[0]
        const coordinates = screenToMazeCoordinates(touch.clientX, touch.clientY)
        if (!coordinates) return

        // logger.debug('🎯 触摸坐标:', coordinates)
        moveToPosition(coordinates.x, coordinates.y)
      }
    },
    [gameStarted, gameCompleted, screenToMazeCoordinates, moveToPosition, startGame]
  )

  // 绑定事件监听器
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('click', handleCanvasClick)
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      canvas.removeEventListener('click', handleCanvasClick)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleCanvasClick, handleTouchEnd])

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameStarted || gameCompleted) return

      // 如果正在自动移动，先中断
      if (isAutoMoving) {
        const { interruptAutoMove } = useMazeStore.getState()
        interruptAutoMove()
        // 短暂延迟后再执行键盘移动
        setTimeout(() => {
          const { moveBall } = useMazeStore.getState()
          executeKeyboardMove(event, moveBall)
        }, 100)
        return
      }

      const { moveBall } = useMazeStore.getState()
      executeKeyboardMove(event, moveBall)
    }

    const executeKeyboardMove = (
      event: KeyboardEvent,
      moveBall: (direction: 'up' | 'down' | 'left' | 'right') => void
    ) => {
      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          event.preventDefault()
          moveBall('up')
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault()
          moveBall('down')
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault()
          moveBall('left')
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault()
          moveBall('right')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameStarted, gameCompleted, isAutoMoving])

  return (
    <div className="relative w-full">
      {/* 游戏信息 */}
      <div className="border-border/60 bg-card mb-4 flex items-center justify-between rounded-lg border p-4">
        <div className="flex gap-6">
          <div className="text-sm">
            <span className="text-muted-foreground">移动次数:</span>
            <span className="text-foreground ml-2 font-semibold">{moves}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">用时:</span>
            <span className="text-foreground ml-2 font-semibold">{gameTime}秒</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={resetGame}
            className="bg-muted text-foreground hover:bg-muted/80 rounded-lg px-4 py-2 text-sm transition-colors"
          >
            重新开始
          </button>
        </div>
      </div>

      {/* 游戏画布 */}
      <MazeCanvas ref={canvasRef} />

      {gameCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="border-border/60 bg-card text-foreground rounded-lg border p-8 text-center shadow-xl">
            <h3 className="mb-4 text-3xl font-bold text-emerald-500">🎉 恭喜通关！</h3>
            <div className="text-muted-foreground mb-6 space-y-2">
              <p>
                移动次数: <span className="font-bold text-blue-500">{moves}</span>
              </p>
              <p>
                用时: <span className="font-bold text-emerald-500">{gameTime}秒</span>
              </p>
            </div>
            <button
              onClick={resetGame}
              className="rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-600"
            >
              再来一局
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
