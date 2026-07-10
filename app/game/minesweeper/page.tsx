'use client'

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { toast } from 'sonner'
import { getDynamicDifficulties } from './config'
import { MinesweeperBoard } from './components/MinesweeperBoard'
import { MinesweeperHeader } from './components/MinesweeperHeader'
import { MinesweeperStats } from './components/MinesweeperStats'
import { useMinesweeperStore } from './store'
import type { Cell, Difficulty, DifficultyConfig, MinesweeperGameState } from './types'
import { createEmptyBoard } from './utils/board'

export default function MinesweeperGame() {
  const { stats, updateStats } = useMinesweeperStore()
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [difficulties, setDifficulties] = useState(() => getDynamicDifficulties())
  const [board, setBoard] = useState<Cell[][]>(() => {
    const initialDifficulties = getDynamicDifficulties()
    const initialConfig = initialDifficulties.easy
    return createEmptyBoard(initialConfig.rows, initialConfig.cols)
  })
  const [gameState, setGameState] = useState<MinesweeperGameState>('playing')
  const [mineCount, setMineCount] = useState(() => getDynamicDifficulties().easy.mines)
  const [firstClick, setFirstClick] = useState(true)
  const [timer, setTimer] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const lastResultRef = useRef<'won' | 'lost' | null>(null)
  const advanceTimeRemainderRef = useRef(0)

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const config = difficulties[difficulty]

  // 放置地雷
  const placeMines = useCallback(
    (board: Cell[][], firstClickRow: number, firstClickCol: number) => {
      const newBoard = board.map(row => row.map(cell => ({ ...cell })))
      let minesPlaced = 0

      while (minesPlaced < config.mines) {
        const row = Math.floor(Math.random() * config.rows)
        const col = Math.floor(Math.random() * config.cols)

        // 不在第一次点击位置和周围放置地雷
        const isFirstClickArea =
          Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1

        if (!newBoard[row][col].isMine && !isFirstClickArea) {
          newBoard[row][col].isMine = true
          minesPlaced++
        }
      }

      return newBoard
    },
    [config]
  )

  // 计算邻居地雷数量
  const calculateNeighbors = useCallback(
    (board: Cell[][]) => {
      const newBoard = board.map(row => row.map(cell => ({ ...cell })))

      for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
          if (!newBoard[row][col].isMine) {
            let count = 0
            for (let i = -1; i <= 1; i++) {
              for (let j = -1; j <= 1; j++) {
                const newRow = row + i
                const newCol = col + j
                if (
                  newRow >= 0 &&
                  newRow < config.rows &&
                  newCol >= 0 &&
                  newCol < config.cols &&
                  newBoard[newRow][newCol].isMine
                ) {
                  count++
                }
              }
            }
            newBoard[row][col].neighborCount = count
          }
        }
      }

      return newBoard
    },
    [config]
  )

  // 重置游戏
  const resetGame = useCallback(
    (targetConfig: DifficultyConfig = config) => {
      setBoard(createEmptyBoard(targetConfig.rows, targetConfig.cols))
      setGameState('playing')
      setMineCount(targetConfig.mines)
      setFirstClick(true)
      setTimer(0)
      setGameStarted(false)
      advanceTimeRemainderRef.current = 0
    },
    [config]
  )

  // 监听屏幕大小变化
  useEffect(() => {
    const handleResize = () => {
      const newDifficulties = getDynamicDifficulties()
      setDifficulties(newDifficulties)
      resetGame(newDifficulties[difficulty])
    }

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [difficulty, resetGame])

  const checkWinCondition = useCallback(
    (nextBoard: Cell[][]) => {
      let hiddenCount = 0
      let flaggedCount = 0

      for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
          const cell = nextBoard[row]?.[col]
          if (!cell) continue
          if (cell.state === 'hidden') hiddenCount++
          if (cell.state === 'flagged') flaggedCount++
        }
      }

      return hiddenCount + flaggedCount === config.mines
    },
    [config]
  )

  // 揭示空白区域
  const revealEmptyArea = useCallback(
    (board: Cell[][], row: number, col: number) => {
      const newBoard = board.map(row => row.map(cell => ({ ...cell })))
      const stack: [number, number][] = [[row, col]]

      while (stack.length > 0) {
        const [currentRow, currentCol] = stack.pop()!

        if (
          currentRow < 0 ||
          currentRow >= config.rows ||
          currentCol < 0 ||
          currentCol >= config.cols ||
          newBoard[currentRow][currentCol].state !== 'hidden'
        ) {
          continue
        }

        newBoard[currentRow][currentCol].state = 'revealed'

        if (newBoard[currentRow][currentCol].neighborCount === 0) {
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              stack.push([currentRow + i, currentCol + j])
            }
          }
        }
      }

      return newBoard
    },
    [config]
  )

  // 标记格子
  const handleCellFlag = useCallback(
    (row: number, col: number) => {
      if (gameState !== 'playing') return

      setBoard(currentBoard => {
        const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })))

        if (newBoard[row][col].state === 'hidden') {
          newBoard[row][col].state = 'flagged'
          setMineCount(prev => prev - 1)
        } else if (newBoard[row][col].state === 'flagged') {
          newBoard[row][col].state = 'hidden'
          setMineCount(prev => prev + 1)
        }

        if (checkWinCondition(newBoard)) {
          setGameState('won')
        }

        return newBoard
      })
    },
    [gameState, checkWinCondition]
  )

  // 点击格子
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (gameState !== 'playing') return

      setBoard(currentBoard => {
        let newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })))

        if (newBoard[row][col].state !== 'hidden') return currentBoard

        // 第一次点击
        if (firstClick) {
          newBoard = placeMines(newBoard, row, col)
          newBoard = calculateNeighbors(newBoard)
          setFirstClick(false)
          setGameStarted(true)
        }

        // 点到地雷
        if (newBoard[row][col].isMine) {
          // 揭示所有地雷
          for (let i = 0; i < config.rows; i++) {
            for (let j = 0; j < config.cols; j++) {
              if (newBoard[i][j].isMine) {
                newBoard[i][j].state = 'revealed'
              }
            }
          }
          setGameState('lost')
          return newBoard
        }

        // 揭示格子
        if (newBoard[row][col].neighborCount === 0) {
          newBoard = revealEmptyArea(newBoard, row, col)
        } else {
          newBoard[row][col].state = 'revealed'
        }

        if (checkWinCondition(newBoard)) {
          setGameState('won')
        }

        return newBoard
      })
    },
    [
      gameState,
      firstClick,
      placeMines,
      calculateNeighbors,
      revealEmptyArea,
      config,
      checkWinCondition,
    ]
  )

  // 右键标记（桌面端）
  const handleCellRightClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>, row: number, col: number) => {
      e.preventDefault()
      e.stopPropagation()
      handleCellFlag(row, col)
      return false
    },
    [handleCellFlag]
  )

  // 长按开始
  const handleTouchStart = useCallback(
    (row: number, col: number) => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)

      longPressTimerRef.current = setTimeout(() => {
        handleCellFlag(row, col)
        longPressTimerRef.current = null
      }, 500)
    },
    [handleCellFlag]
  )

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  useEffect(
    () => () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    },
    []
  )

  // 计时器
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (gameStarted && gameState === 'playing') {
      interval = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gameStarted, gameState])

  useEffect(() => {
    if (gameState === 'playing') {
      lastResultRef.current = null
      return
    }

    if (lastResultRef.current === gameState) return

    if (gameState === 'won') {
      updateStats(difficulty, true, timer)
      toast.success('恭喜！你赢了！')
    } else {
      updateStats(difficulty, false)
      toast.error('踩到地雷了！游戏结束')
    }

    lastResultRef.current = gameState
  }, [gameState, difficulty, timer, updateStats])

  useEffect(() => {
    const gameWindow = window as Window & {
      advanceTime?: (milliseconds: number) => void
      render_game_to_text?: () => string
    }

    gameWindow.render_game_to_text = () =>
      JSON.stringify({
        coordinateSystem: 'board[row][column], origin top-left',
        mode: gameState,
        difficulty,
        timer,
        remainingMines: mineCount,
        rows: config.rows,
        columns: config.cols,
        board: board.map(row =>
          row.map(cell => ({
            state: cell.state,
            value: cell.state === 'revealed' ? (cell.isMine ? 'mine' : cell.neighborCount) : null,
          }))
        ),
      })
    gameWindow.advanceTime = milliseconds => {
      if (!gameStarted || gameState !== 'playing') return

      advanceTimeRemainderRef.current += Math.max(0, milliseconds)
      const elapsedSeconds = Math.floor(advanceTimeRemainderRef.current / 1000)
      if (elapsedSeconds === 0) return

      advanceTimeRemainderRef.current %= 1000
      setTimer(current => current + elapsedSeconds)
    }

    return () => {
      delete gameWindow.render_game_to_text
      delete gameWindow.advanceTime
    }
  }, [board, config.cols, config.rows, difficulty, gameStarted, gameState, mineCount, timer])

  return (
    <div className="container mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-4">
      <MinesweeperHeader
        difficulty={difficulty}
        timer={timer}
        mineCount={mineCount}
        gameState={gameState}
        onDifficultyChange={nextDifficulty => {
          setDifficulty(nextDifficulty)
          resetGame(difficulties[nextDifficulty])
        }}
        onReset={() => resetGame()}
      />

      <div className="flex flex-1 flex-col items-center justify-center space-y-6 py-8">
        <MinesweeperBoard
          board={board}
          config={config}
          onCellClick={handleCellClick}
          onCellRightClick={handleCellRightClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
        <MinesweeperStats
          gamesPlayed={stats[difficulty].gamesPlayed}
          gamesWon={stats[difficulty].gamesWon}
          bestTime={stats[difficulty].bestTime}
        />
      </div>
    </div>
  )
}
