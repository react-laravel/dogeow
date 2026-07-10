'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { isMobileDevice } from '@/lib/utils/userAgent'
import { AutoPlayControls } from './components/AutoPlayControls'
import { DirectionControls } from './components/DirectionControls'
import { Game2048Header } from './components/Game2048Header'
import { GameBoard } from './components/GameBoard'
import { GameStatus } from './components/GameStatus'
import { DEFAULT_AUTO_PLAY_SPEED } from './config'
import {
  useAutoPlay,
  useGameSound,
  useGyroscopeControls,
  useKeyboardControls,
  useSwipeControls,
} from './hooks'
import { useGame2048Store } from './store'
import {
  type Board,
  type Direction,
  addRandomTile,
  initializeBoard,
  isGameOver,
  moveDown,
  moveLeft,
  moveRight,
  moveUp,
} from './utils/gameEngine'

const RANDOM_DIRECTION_DISPLAY_TIME = 500
const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left']
const MOVE_HANDLERS = {
  left: moveLeft,
  right: moveRight,
  up: moveUp,
  down: moveDown,
}

const getRandomDirection = (): Direction =>
  DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]

export default function Game2048() {
  const { bestScore, setBestScore, incrementGamesPlayed, incrementGamesWon } = useGame2048Store()
  const [board, setBoard] = useState<Board>(initializeBoard)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [history, setHistory] = useState<{ board: Board; score: number }[]>([])
  const [showRandomDirection, setShowRandomDirection] = useState<Direction | null>(null)
  const [isMobile] = useState(() => isMobileDevice())
  const randomDirectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { playSound } = useGameSound()

  const handleMove = useCallback(
    (direction: Direction) => {
      if (gameOver) return

      setBoard(currentBoard => {
        const result = MOVE_HANDLERS[direction](currentBoard)
        if (!result.moved) return currentBoard

        void playSound()
        const nextBoard = result.newBoard.map(row => [...row])
        addRandomTile(nextBoard)

        if (!gameWon && nextBoard.some(row => row.includes(2048))) {
          setGameWon(true)
          incrementGamesWon()
        }

        setScore(currentScore => {
          setHistory(currentHistory => [
            ...currentHistory.slice(-4),
            {
              board: currentBoard.map(row => [...row]),
              score: currentScore,
            },
          ])
          return currentScore + result.scoreGained
        })

        if (isGameOver(nextBoard)) {
          setGameOver(true)
          incrementGamesPlayed()
          toast.error('游戏结束！')
        }

        return nextBoard
      })
    },
    [gameOver, gameWon, incrementGamesPlayed, incrementGamesWon, playSound]
  )

  const {
    isRunning: isAutoPlayRunning,
    isDirectional: isDirectionalRunning,
    isClockwise,
    speed,
    changeSpeed,
    stop: stopAutoPlay,
    reset: resetAutoPlay,
    toggleRandom,
    toggleClockwise,
    toggleCounterClockwise,
  } = useAutoPlay({
    onMove: handleMove,
    speed: DEFAULT_AUTO_PLAY_SPEED,
    enabled: !gameOver,
  })
  const isAutoRunning = isAutoPlayRunning && !isDirectionalRunning

  const {
    isSupported: isGyroscopeSupported,
    isEnabled: isGyroscopeEnabled,
    toggle: toggleGyroscope,
  } = useGyroscopeControls({ onMove: handleMove })

  useKeyboardControls({ onMove: handleMove, enabled: !gameOver })
  useSwipeControls({
    onMove: handleMove,
    enabled: !gameOver && !isGyroscopeEnabled,
  })

  const randomMoveOnce = useCallback(() => {
    if (gameOver || isAutoPlayRunning) return

    const direction = getRandomDirection()
    setShowRandomDirection(direction)
    handleMove(direction)

    if (randomDirectionTimeoutRef.current) {
      clearTimeout(randomDirectionTimeoutRef.current)
    }
    randomDirectionTimeoutRef.current = setTimeout(
      () => setShowRandomDirection(null),
      RANDOM_DIRECTION_DISPLAY_TIME
    )
  }, [gameOver, handleMove, isAutoPlayRunning])

  const resetGame = useCallback(() => {
    resetAutoPlay()
    setBoard(initializeBoard())
    setScore(0)
    setGameOver(false)
    setGameWon(false)
    setHistory([])
    setShowRandomDirection(null)
  }, [resetAutoPlay])

  const undoMove = useCallback(() => {
    const previous = history[history.length - 1]
    if (!previous) return

    stopAutoPlay()
    setBoard(previous.board)
    setScore(previous.score)
    setHistory(currentHistory => currentHistory.slice(0, -1))
    setGameOver(false)
    void playSound()
  }, [history, playSound, stopAutoPlay])

  useEffect(() => {
    if (score > 0) setBestScore(score)
  }, [score, setBestScore])

  useEffect(
    () => () => {
      if (randomDirectionTimeoutRef.current) {
        clearTimeout(randomDirectionTimeoutRef.current)
      }
    },
    []
  )

  useEffect(() => {
    const gameWindow = window as Window & {
      advanceTime?: (milliseconds: number) => void
      render_game_to_text?: () => string
    }

    gameWindow.render_game_to_text = () =>
      JSON.stringify({
        coordinateSystem: 'board[row][column], origin top-left',
        mode: gameOver ? 'game-over' : gameWon ? 'won' : 'playing',
        score,
        bestScore,
        autoPlay: isDirectionalRunning
          ? isClockwise
            ? 'clockwise'
            : 'counter-clockwise'
          : isAutoRunning
            ? 'random'
            : 'idle',
        board,
      })
    gameWindow.advanceTime = () => undefined

    return () => {
      delete gameWindow.render_game_to_text
      delete gameWindow.advanceTime
    }
  }, [bestScore, board, gameOver, gameWon, isAutoRunning, isClockwise, isDirectionalRunning, score])

  return (
    <div className="container mx-auto max-w-md px-4 py-4" onContextMenu={e => e.preventDefault()}>
      <Game2048Header
        score={score}
        bestScore={bestScore}
        canUndo={history.length > 0}
        gameOver={gameOver}
        showGyroscope={isMobile && isGyroscopeSupported}
        gyroscopeEnabled={isGyroscopeEnabled}
        onUndo={undoMove}
        onReset={resetGame}
        onToggleGyroscope={() => void toggleGyroscope()}
      />

      <GameBoard board={board} />
      <GameStatus gameWon={gameWon} gameOver={gameOver} score={score} />

      <DirectionControls
        onMove={handleMove}
        onRandomMove={randomMoveOnce}
        disabled={gameOver || isAutoPlayRunning}
        showRandomDirection={showRandomDirection}
      />

      <div className="bg-border my-6 h-px w-full" />

      <AutoPlayControls
        speed={speed}
        gameOver={gameOver}
        randomRunning={isAutoRunning}
        directionalRunning={isDirectionalRunning}
        clockwise={isClockwise}
        onSpeedChange={changeSpeed}
        onToggleRandom={toggleRandom}
        onToggleClockwise={toggleClockwise}
        onToggleCounterClockwise={toggleCounterClockwise}
      />
    </div>
  )
}
