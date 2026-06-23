'use client'

import { useState, useEffect, useCallback, useRef, memo } from 'react'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useMinesweeperStore } from './store'
import { GameRulesDialog } from '@/components/ui/game-rules-dialog'
import Link from 'next/link'

type CellState = 'hidden' | 'revealed' | 'flagged'
type Cell = {
  isMine: boolean
  neighborCount: number
  state: CellState
}

type Difficulty = 'easy' | 'medium' | 'hard'
type DifficultyConfig = { rows: number; cols: number; mines: number }

// 根据屏幕大小动态计算难度配置
const getDynamicDifficulties = () => {
  if (typeof window === 'undefined') {
    // 服务端渲染时的默认值
    return {
      easy: { rows: 9, cols: 9, mines: 10 },
      medium: { rows: 15, cols: 12, mines: 27 },
      hard: { rows: 20, cols: 15, mines: 48 },
    }
  }

  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  const isPortrait = screenHeight > screenWidth

  // 计算可用空间（考虑UI元素占用的空间）
  const availableWidth = Math.min(screenWidth - 32, 1000) // 减去padding，最大1000px以支持长方形
  const availableHeight = screenHeight - 400 // 减去头部UI占用的空间

  // 每个格子32px
  const maxCols = Math.floor(availableWidth / 32)
  const maxRows = Math.floor(availableHeight / 32)

  if (isPortrait || screenWidth < 768) {
    // 移动设备或竖屏 - 利用可滚动特性，支持长方形
    const mediumRows = Math.min(15, 20) // 允许更多行，因为可以滚动
    const mediumCols = Math.min(10, maxCols)
    const hardRows = Math.min(20, 25) // 允许更多行
    const hardCols = Math.min(12, maxCols)

    return {
      easy: { rows: 8, cols: 8, mines: 10 },
      medium: {
        rows: mediumRows,
        cols: mediumCols,
        mines: Math.floor(mediumRows * mediumCols * 0.15),
      },
      hard: {
        rows: hardRows,
        cols: hardCols,
        mines: Math.floor(hardRows * hardCols * 0.17),
      },
    }
  } else {
    // 桌面设备 - 可以使用长方形
    const mediumRows = Math.min(13, maxRows)
    const mediumCols = Math.min(15, maxCols)
    const hardRows = Math.min(16, maxRows)
    const hardCols = Math.min(30, maxCols)

    return {
      easy: { rows: 9, cols: 9, mines: 10 },
      medium: {
        rows: mediumRows,
        cols: mediumCols,
        mines: Math.floor(mediumRows * mediumCols * 0.15),
      },
      hard: {
        rows: hardRows,
        cols: hardCols,
        mines: Math.floor(hardRows * hardCols * 0.16),
      },
    }
  }
}

const createEmptyBoard = (rows: number, cols: number): Cell[][] => {
  const newBoard: Cell[][] = []
  for (let row = 0; row < rows; row++) {
    newBoard[row] = []
    for (let col = 0; col < cols; col++) {
      newBoard[row][col] = {
        isMine: false,
        neighborCount: 0,
        state: 'hidden',
      }
    }
  }
  return newBoard
}

// 获取格子显示内容（纯函数，移到组件外部）
const getCellContent = (cell: Cell): string => {
  if (!cell || cell.state === undefined) return ''
  if (cell.state === 'flagged') return '🚩'
  if (cell.state === 'hidden') return ''
  if (cell.isMine) return '💣'
  if (cell.neighborCount === 0) return ''
  return cell.neighborCount.toString()
}

// 获取格子样式（纯函数，移到组件外部）
const getCellStyle = (cell: Cell): string => {
  const baseStyle =
    'w-8 h-8 border border-gray-400 flex items-center justify-center text-sm font-bold cursor-pointer select-none'

  if (!cell || cell.state === undefined) {
    return `${baseStyle} bg-gray-300 dark:bg-gray-600`
  }

  if (cell.state === 'hidden') {
    return `${baseStyle} bg-gray-300 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500`
  }

  if (cell.state === 'flagged') {
    return `${baseStyle} bg-yellow-200 dark:bg-yellow-700`
  }

  if (cell.isMine) {
    return `${baseStyle} bg-red-500 text-white`
  }

  const numberColors = [
    '', // 0
    'text-blue-600', // 1
    'text-green-600', // 2
    'text-red-600', // 3
    'text-purple-600', // 4
    'text-yellow-600', // 5
    'text-pink-600', // 6
    'text-gray-600', // 7
    'text-black', // 8
  ]

  return `${baseStyle} bg-gray-100 dark:bg-gray-700 ${numberColors[cell.neighborCount] || ''}`
}

// 格子组件 - 使用 memo 优化渲染性能
interface MinesweeperCellProps {
  cell: Cell
  rowIndex: number
  colIndex: number
  onCellClick: (row: number, col: number) => void
  onCellRightClick: (e: React.MouseEvent, row: number, col: number) => void
  onTouchStart: (row: number, col: number) => void
  onTouchEnd: () => void
}

const MinesweeperCell = memo(function MinesweeperCell({
  cell,
  rowIndex,
  colIndex,
  onCellClick,
  onCellRightClick,
  onTouchStart,
  onTouchEnd,
}: MinesweeperCellProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`扫雷格子 ${rowIndex + 1}-${colIndex + 1}`}
      className={getCellStyle(cell)}
      onClick={() => onCellClick(rowIndex, colIndex)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onCellClick(rowIndex, colIndex)
        }
      }}
      onContextMenu={e => onCellRightClick(e, rowIndex, colIndex)}
      onTouchStart={() => onTouchStart(rowIndex, colIndex)}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      onMouseDown={e => {
        // 阻止鼠标中键和右键的默认行为
        if (e.button === 1 || e.button === 2) {
          e.preventDefault()
        }
      }}
    >
      {getCellContent(cell)}
    </div>
  )
})

export default function MinesweeperGame() {
  const { stats, updateStats } = useMinesweeperStore()
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [difficulties, setDifficulties] = useState(() => getDynamicDifficulties())
  const [board, setBoard] = useState<Cell[][]>(() => {
    const initialDifficulties = getDynamicDifficulties()
    const initialConfig = initialDifficulties.easy
    return createEmptyBoard(initialConfig.rows, initialConfig.cols)
  })
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing')
  const [mineCount, setMineCount] = useState(() => getDynamicDifficulties().easy.mines)
  const [flagCount, setFlagCount] = useState(0)
  const [firstClick, setFirstClick] = useState(true)
  const [timer, setTimer] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const lastResultRef = useRef<'won' | 'lost' | null>(null)

  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)

  const config = difficulties[difficulty]

  // 阻止整个页面的右键菜单
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  // 初始化棋盘
  const initializeBoard = useCallback(
    (targetConfig: DifficultyConfig = config) => {
      return createEmptyBoard(targetConfig.rows, targetConfig.cols)
    },
    [config]
  )

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
      setBoard(initializeBoard(targetConfig))
      setGameState('playing')
      setMineCount(targetConfig.mines)
      setFlagCount(0)
      setFirstClick(true)
      setTimer(0)
      setGameStarted(false)
    },
    [initializeBoard, config]
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
          setFlagCount(prev => prev + 1)
          setMineCount(prev => prev - 1)
        } else if (newBoard[row][col].state === 'flagged') {
          newBoard[row][col].state = 'hidden'
          setFlagCount(prev => prev - 1)
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
    (e: React.MouseEvent, row: number, col: number) => {
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
      const timer = setTimeout(() => {
        handleCellFlag(row, col)
        setLongPressTimer(null)
      }, 500) // 500ms长按
      setLongPressTimer(timer)
    },
    [handleCellFlag]
  )

  // 长按结束
  const handleTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }, [longPressTimer])

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

  // 获取格子显示内容
  // (moved to module-level getCellContent)

  return (
    <div className="container mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-4">
      {/* 头部区域 */}
      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="flex w-full items-center justify-between">
          <div className="text-muted-foreground text-sm">
            <Link href="/game" className="hover:text-foreground transition-colors">
              游戏中心
            </Link>
            <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground font-medium">扫雷</span>
          </div>
          <GameRulesDialog
            title="扫雷游戏规则"
            rules={[
              '找出所有地雷位置而不踩雷',
              '数字表示周围8个格子的地雷数量',
              '左键点击揭示格子，右键标记地雷',
              '手机端可长按标记或使用标记模式',
              '揭示所有非地雷格子即可获胜',
              '点到地雷就失败了',
            ]}
          />
        </div>

        {/* 难度选择 */}
        <div className="flex flex-wrap justify-center gap-2">
          {Object.entries(difficulties).map(([key]) => (
            <Button
              key={key}
              variant={difficulty === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                const nextDifficulty = key as Difficulty
                setDifficulty(nextDifficulty)
                resetGame(difficulties[nextDifficulty])
              }}
              className="text-xs"
            >
              {key === 'easy' ? '简单' : key === 'medium' ? '中等' : '困难'}
            </Button>
          ))}
        </div>

        {/* 游戏信息 */}
        <div className="flex items-center justify-center space-x-8">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">时间</div>
            <div className="text-xl font-bold">{timer}s</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">地雷</div>
            <div className="text-xl font-bold">{mineCount}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">状态</div>
            <div className="text-xl">
              {gameState === 'playing' ? '🙂' : gameState === 'won' ? '😎' : '😵'}
            </div>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => resetGame()} variant="outline" size="sm">
            重新开始
          </Button>
        </div>
      </div>

      {/* 游戏区域 */}
      <div className="flex flex-1 flex-col items-center justify-center space-y-6 py-8">
        {board.length > 0 && board[0] && board[0].length > 0 ? (
          <div
            className="grid gap-0"
            style={{
              gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
              maxWidth: `${config.cols * 32}px`,
              touchAction: 'none',
            }}
            onContextMenu={e => {
              e.preventDefault()
              return false
            }}
          >
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <MinesweeperCell
                  key={`${rowIndex}-${colIndex}`}
                  cell={cell}
                  rowIndex={rowIndex}
                  colIndex={colIndex}
                  onCellClick={handleCellClick}
                  onCellRightClick={handleCellRightClick}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                />
              ))
            )}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center">
            <div className="text-gray-500">正在初始化游戏...</div>
          </div>
        )}

        {/* 统计信息 */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <div>游戏: {stats[difficulty].gamesPlayed}</div>
              <div>胜利: {stats[difficulty].gamesWon}</div>
            </div>
            <div className="text-center">
              <div>
                胜率:{' '}
                {stats[difficulty].gamesPlayed > 0
                  ? Math.round((stats[difficulty].gamesWon / stats[difficulty].gamesPlayed) * 100)
                  : 0}
                %
              </div>
            </div>
            <div className="text-center">
              <div>
                最佳: {stats[difficulty].bestTime > 0 ? `${stats[difficulty].bestTime}s` : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
