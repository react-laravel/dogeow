import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMazeStore, MazeCell, Ball } from '../store'

// Mock console.log to reduce noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {})

describe('MazeStore', () => {
  beforeEach(() => {
    useMazeStore.setState({
      gameStarted: false,
      gameCompleted: false,
      gameTime: 0,
      moves: 0,
      mazeSize: 15,
      maze: [],
      ball: { x: 0, y: 0, z: 0 },
      isMoving: false,
      autoPath: [],
      isAutoMoving: false,
      autoMoveInterrupt: false,
    })
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useMazeStore.getState()
      expect(state.gameStarted).toBe(false)
      expect(state.gameCompleted).toBe(false)
      expect(state.gameTime).toBe(0)
      expect(state.moves).toBe(0)
      expect(state.mazeSize).toBe(15)
      expect(state.ball).toEqual({ x: 0, y: 0, z: 0 })
    })
  })

  describe('generateMaze', () => {
    it('should generate a maze with correct dimensions', () => {
      const { generateMaze, mazeSize } = useMazeStore.getState()
      generateMaze()
      const { maze } = useMazeStore.getState()
      expect(maze).toHaveLength(mazeSize)
      expect(maze[0]).toHaveLength(mazeSize)
    })

    it('should initialize all cells with walls', () => {
      const { generateMaze } = useMazeStore.getState()
      generateMaze()
      const { maze } = useMazeStore.getState()

      for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
          const cell = maze[y][x]
          expect(cell.top).toBe(true)
          expect(cell.right).toBe(true)
          expect(cell.bottom).toBe(true)
          expect(cell.left).toBe(true)
        }
      }
    })

    it('should mark start cell as visited', () => {
      const { generateMaze } = useMazeStore.getState()
      generateMaze()
      const { maze } = useMazeStore.getState()
      expect(maze[0][0].visited).toBe(true)
    })

    it('should have path from start to end', () => {
      const { generateMaze, mazeSize } = useMazeStore.getState()
      generateMaze()
      const { maze } = useMazeStore.getState()

      // Check that start (0,0) and end (mazeSize-1, mazeSize-1) are connected
      const startCell = maze[0][0]
      const endCell = maze[mazeSize - 1][mazeSize - 1]

      // At least one wall should be removed from start
      const startWallsRemoved =
        !startCell.right || !startCell.bottom || !startCell.top || !startCell.left
      expect(startWallsRemoved).toBe(true)

      // At least one wall should be removed from end
      const endWallsRemoved =
        !endCell.right || !endCell.bottom || !endCell.top || !endCell.left
      expect(endWallsRemoved).toBe(true)
    })
  })

  describe('startGame', () => {
    it('should start the game and generate maze', () => {
      const { startGame } = useMazeStore.getState()
      startGame()
      const state = useMazeStore.getState()
      expect(state.gameStarted).toBe(true)
      expect(state.gameTime).toBe(0)
      expect(state.moves).toBe(0)
      expect(state.gameCompleted).toBe(false)
    })

    it('should reset ball to start position', () => {
      const { startGame, ball } = useMazeStore.getState()
      startGame()
      const state = useMazeStore.getState()
      expect(state.ball.x).toBe(0)
      expect(state.ball.z).toBe(0)
    })

    it('should not restart if game already started', () => {
      const { startGame } = useMazeStore.getState()
      startGame()
      const { maze: mazeBefore } = useMazeStore.getState()

      // Try to start again immediately
      startGame()
      const { maze: mazeAfter } = useMazeStore.getState()
      expect(mazeAfter).toEqual(mazeBefore)
    })
  })

  describe('resetGame', () => {
    it('should reset all game state', () => {
      const { startGame, resetGame, moveBall } = useMazeStore.getState()
      startGame()
      moveBall('right')
      resetGame()

      const state = useMazeStore.getState()
      expect(state.gameStarted).toBe(false)
      expect(state.gameCompleted).toBe(false)
      expect(state.gameTime).toBe(0)
      expect(state.moves).toBe(0)
      expect(state.ball).toEqual({ x: 0, y: 0, z: 0 })
      expect(state.maze).toEqual([])
    })
  })

  describe('moveBall', () => {
    beforeEach(() => {
      const { startGame } = useMazeStore.getState()
      startGame()
    })

    it('should increment moves counter', () => {
      const { moveBall } = useMazeStore.getState()
      const initialMoves = useMazeStore.getState().moves
      moveBall('right')
      expect(useMazeStore.getState().moves).toBe(initialMoves + 1)
    })

    it('should not move if game not started', () => {
      const { resetGame, moveBall } = useMazeStore.getState()
      resetGame()
      const { ball: ballBefore } = useMazeStore.getState()
      moveBall('right')
      const { ball: ballAfter } = useMazeStore.getState()
      expect(ballAfter).toEqual(ballBefore)
    })

    it('should not move if game completed', () => {
      const { set } = useMazeStore.getState()
      set({ gameCompleted: true })
      const { moveBall } = useMazeStore.getState()
      const { ball: ballBefore } = useMazeStore.getState()
      moveBall('right')
      const { ball: ballAfter } = useMazeStore.getState()
      expect(ballAfter).toEqual(ballBefore)
    })

    it('should not move if already moving', () => {
      const { set, moveBall } = useMazeStore.getState()
      set({ isMoving: true })
      const { ball: ballBefore } = useMazeStore.getState()
      moveBall('right')
      const { ball: ballAfter } = useMazeStore.getState()
      expect(ballAfter).toEqual(ballBefore)
    })
  })

  describe('interruptAutoMove', () => {
    it('should set autoMoveInterrupt to true', () => {
      const { interruptAutoMove } = useMazeStore.getState()
      interruptAutoMove()
      expect(useMazeStore.getState().autoMoveInterrupt).toBe(true)
    })
  })

  describe('Game Completion', () => {
    it('should mark game as completed when ball reaches end', () => {
      const { set, generateMaze, mazeSize } = useMazeStore.getState()
      generateMaze()
      set({ gameStarted: true })

      // Move ball to end position
      const { ball } = useMazeStore.getState()
      set({ ball: { ...ball, x: mazeSize - 1, z: mazeSize - 1 } })

      // Manually trigger completion check by moving
      const { moveBall } = useMazeStore.getState()
      moveBall('right')

      expect(useMazeStore.getState().gameCompleted).toBe(true)
    })
  })

  describe('Maze Size Configuration', () => {
    it('should respect custom maze size', () => {
      const { set, generateMaze, mazeSize } = useMazeStore.getState()
      set({ mazeSize: 10 })
      generateMaze()
      const { maze } = useMazeStore.getState()
      expect(maze).toHaveLength(10)
      expect(maze[0]).toHaveLength(10)
    })
  })
})