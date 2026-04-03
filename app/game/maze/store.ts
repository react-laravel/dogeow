import { create } from 'zustand'
import { logger } from '@/lib/logger'

export interface MazeCell {
  top: boolean
  right: boolean
  bottom: boolean
  left: boolean
  visited?: boolean
}

export interface Ball {
  x: number
  y: number
  z: number
}

export interface MazeStore {
  // 游戏状态
  gameStarted: boolean
  gameCompleted: boolean
  gameTime: number
  moves: number

  // 迷宫设置
  mazeSize: number
  maze: MazeCell[][]

  // 小球
  ball: Ball
  isMoving: boolean

  // 自动寻路
  autoPath: { x: number; y: number }[]
  isAutoMoving: boolean
  autoMoveInterrupt: boolean

  // 动作
  startGame: () => void
  resetGame: () => void
  generateMaze: () => void
  moveBall: (direction: 'up' | 'down' | 'left' | 'right') => void
  moveToPosition: (targetX: number, targetY: number) => void
  interruptAutoMove: () => void
}

export const useMazeStore = create<MazeStore>((set, get) => ({
  // 初始状态
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

  startGame: () => {
    logger.debug('🎮 开始游戏')
    const state = get()

    if (!state.gameStarted) {
      // 先生成迷宫，再设置游戏开始状态
      get().generateMaze()

      set({
        gameStarted: true,
        gameTime: 0,
        moves: 0,
        gameCompleted: false,
        ball: { x: 0, y: 0, z: 0 }, // 确保小球在起点
      })

      // 开始计时
      const startTime = Date.now()
      const timer = setInterval(() => {
        const current = get()
        if (current.gameStarted && !current.gameCompleted) {
          set({ gameTime: Math.floor((Date.now() - startTime) / 1000) })
        } else {
          clearInterval(timer)
        }
      }, 1000)

      logger.debug('🎮 游戏已开始，小球位置:', { x: 0, y: 0, z: 0 })
    }
  },

  resetGame: () => {
    set({
      gameStarted: false,
      gameCompleted: false,
      gameTime: 0,
      moves: 0,
      ball: { x: 0, y: 0, z: 0 },
      isMoving: false,
      autoPath: [],
      isAutoMoving: false,
      autoMoveInterrupt: false,
      maze: [], // 清空迷宫
    })
  },

  generateMaze: () => {
    const { mazeSize } = get()
    logger.debug('🏗️ 生成迷宫, 大小:', mazeSize)
    const maze: MazeCell[][] = []

    // 初始化迷宫网格
    for (let y = 0; y < mazeSize; y++) {
      maze[y] = []
      for (let x = 0; x < mazeSize; x++) {
        maze[y][x] = {
          top: true,
          right: true,
          bottom: true,
          left: true,
          visited: false,
        }
      }
    }

    // 使用递归回溯算法生成迷宫
    const stack: Array<{ x: number; y: number }> = []
    const startX = 0
    const startY = 0

    maze[startY][startX].visited = true
    stack.push({ x: startX, y: startY })

    while (stack.length > 0) {
      const current = stack[stack.length - 1]
      const neighbors = getUnvisitedNeighbors(current.x, current.y, maze, mazeSize)

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)]

        // 移除墙壁
        if (next.x === current.x + 1) {
          maze[current.y][current.x].right = false
          maze[next.y][next.x].left = false
        } else if (next.x === current.x - 1) {
          maze[current.y][current.x].left = false
          maze[next.y][next.x].right = false
        } else if (next.y === current.y + 1) {
          maze[current.y][current.x].bottom = false
          maze[next.y][next.x].top = false
        } else if (next.y === current.y - 1) {
          maze[current.y][current.x].top = false
          maze[next.y][next.x].bottom = false
        }

        maze[next.y][next.x].visited = true
        stack.push(next)
      } else {
        stack.pop()
      }
    }

    set({ maze })
    logger.debug('✅ 迷宫生成完成')
    logger.debug('🚪 起点(0,0)墙壁状态:', maze[0][0])
    logger.debug('🎯 终点墙壁状态:', maze[mazeSize - 1][mazeSize - 1])
  },

  moveBall: (direction: 'up' | 'down' | 'left' | 'right') => {
    const state = get()

    logger.debug('🎯 尝试移动:', direction, '当前位置:', { x: state.ball.x, z: state.ball.z })

    if (state.isMoving || state.gameCompleted) {
      logger.debug(
        '❌ 移动被阻止 - isMoving:',
        state.isMoving,
        'gameCompleted:',
        state.gameCompleted
      )
      return
    }

    if (state.maze.length === 0) {
      logger.debug('❌ 迷宫未生成')
      return
    }

    const { ball, maze, mazeSize } = state

    // 使用网格坐标
    const gridX = ball.x
    const gridY = ball.z

    logger.debug('📍 当前网格位置:', { gridX, gridY })
    logger.debug('🚪 当前位置墙壁状态:', maze[gridY] ? maze[gridY][gridX] : '位置无效')

    // 检查是否可以移动
    const canMove = canMoveInDirection(gridX, gridY, direction, maze, mazeSize)
    logger.debug('🚶 可以移动?', canMove)

    if (!canMove) {
      logger.debug('❌ 无法向', direction, '方向移动')
      return
    }

    // 获取下一个位置（单步移动）
    const nextPos = getNextPosition(gridX, gridY, direction)
    logger.debug('🎯 下一个位置:', nextPos)

    set({ isMoving: true, moves: state.moves + 1 })

    // 立即更新位置（2D不需要动画）
    set({
      ball: { ...ball, x: nextPos.x, z: nextPos.y },
      isMoving: false,
    })

    logger.debug('✅ 移动完成，新位置:', { x: nextPos.x, z: nextPos.y })

    // 检查是否到达终点
    if (nextPos.x === mazeSize - 1 && nextPos.y === mazeSize - 1) {
      logger.debug('🎉 到达终点!')
      set({ gameCompleted: true })
    }
  },

  moveToPosition: (targetX: number, targetY: number) => {
    const state = get()
    if (state.maze.length === 0) {
      return
    }

    // 如果当前正在自动移动，先中断
    if (state.isAutoMoving) {
      logger.debug('🛑 中断当前自动移动')
      set({ autoMoveInterrupt: true })
      // 等待一小段时间确保中断生效
      setTimeout(() => {
        get().moveToPosition(targetX, targetY)
      }, 50)
      return
    }

    const { ball, maze, mazeSize } = state

    // logger.debug('🎯 moveToPosition 调用:', { targetX, targetY, currentBall: ball })

    // 使用网格坐标
    const gridX = ball.x
    const gridY = ball.z

    // 确保坐标在有效范围内
    const startX = Math.max(0, Math.min(mazeSize - 1, gridX))
    const startY = Math.max(0, Math.min(mazeSize - 1, gridY))
    const endX = Math.max(0, Math.min(mazeSize - 1, targetX))
    const endY = Math.max(0, Math.min(mazeSize - 1, targetY))

    // logger.debug('🎯 坐标处理:', {
    //   start: { x: startX, y: startY },
    //   end: { x: endX, y: endY }
    // })

    // 如果目标就是当前位置，不需要移动
    if (startX === endX && startY === endY) {
      return
    }

    // 自动寻路
    const path = findPath(startX, startY, endX, endY, maze, mazeSize)

    if (path.length > 0) {
      logger.debug('🚗 自动寻路成功，路径长度:', path.length)

      set({ autoPath: path, isAutoMoving: true, autoMoveInterrupt: false })

      // 开始自动移动
      autoMove(ball, path, () => {
        const currentState = get()
        if (!currentState.autoMoveInterrupt) {
          logger.debug('🎉 到达目标位置!')
          set({ isAutoMoving: false })

          // 如果目标是终点，确保游戏完成
          if (endX === mazeSize - 1 && endY === mazeSize - 1) {
            logger.debug('🏆 确认到达终点，游戏完成!')
            set({ gameCompleted: true })
          }
        }
      })
    }
  },

  interruptAutoMove: () => {
    set({ autoMoveInterrupt: true })
  },
}))

// 辅助函数
function getUnvisitedNeighbors(x: number, y: number, maze: MazeCell[][], size: number) {
  const neighbors = []

  if (x > 0 && !maze[y][x - 1].visited) {
    neighbors.push({ x: x - 1, y })
  }
  if (x < size - 1 && !maze[y][x + 1].visited) {
    neighbors.push({ x: x + 1, y })
  }
  if (y > 0 && !maze[y - 1][x].visited) {
    neighbors.push({ x, y: y - 1 })
  }
  if (y < size - 1 && !maze[y + 1][x].visited) {
    neighbors.push({ x, y: y + 1 })
  }

  return neighbors
}

function canMoveInDirection(
  x: number,
  y: number,
  direction: 'up' | 'down' | 'left' | 'right',
  maze: MazeCell[][],
  mazeSize: number
): boolean {
  if (x < 0 || x >= mazeSize || y < 0 || y >= mazeSize) {
    return false
  }

  const cell = maze[y][x]

  switch (direction) {
    case 'up':
      return !cell.top
    case 'down':
      return !cell.bottom
    case 'left':
      return !cell.left
    case 'right':
      return !cell.right
    default:
      return false
  }
}

function getNextPosition(
  x: number,
  y: number,
  direction: 'up' | 'down' | 'left' | 'right'
): { x: number; y: number } {
  switch (direction) {
    case 'up':
      return { x, y: y - 1 }
    case 'down':
      return { x, y: y + 1 }
    case 'left':
      return { x: x - 1, y }
    case 'right':
      return { x: x + 1, y }
    default:
      return { x, y }
  }
}

function findPath(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  maze: MazeCell[][],
  mazeSize: number
): { x: number; y: number }[] {
  // A*寻路算法
  interface Node {
    x: number
    y: number
    g: number // 从起点到当前点的实际距离
    h: number // 从当前点到终点的预估距离
    f: number // g + h
    parent?: Node
  }

  const openList: Node[] = []
  const closedList: Node[] = []

  const heuristic = (x: number, y: number) => {
    return Math.abs(x - targetX) + Math.abs(y - targetY)
  }

  const startNode: Node = {
    x: startX,
    y: startY,
    g: 0,
    h: heuristic(startX, startY),
    f: heuristic(startX, startY),
  }

  openList.push(startNode)

  while (openList.length > 0) {
    // 找到f值最小的节点
    let currentNode = openList[0]
    let currentIndex = 0

    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < currentNode.f) {
        currentNode = openList[i]
        currentIndex = i
      }
    }

    // 将当前节点从开放列表移到关闭列表
    openList.splice(currentIndex, 1)
    closedList.push(currentNode)

    // 检查是否到达目标
    if (currentNode.x === targetX && currentNode.y === targetY) {
      const path: { x: number; y: number }[] = []
      let current: Node | undefined = currentNode

      while (current) {
        path.unshift({ x: current.x, y: current.y })
        current = current.parent
      }

      return path.slice(1) // 移除起始点
    }

    // 检查所有邻居
    const directions: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right']

    for (const direction of directions) {
      if (!canMoveInDirection(currentNode.x, currentNode.y, direction, maze, mazeSize)) {
        continue
      }

      const nextPos = getNextPosition(currentNode.x, currentNode.y, direction)

      // 检查是否在关闭列表中
      if (closedList.some(node => node.x === nextPos.x && node.y === nextPos.y)) {
        continue
      }

      const g = currentNode.g + 1
      const h = heuristic(nextPos.x, nextPos.y)
      const f = g + h

      // 检查是否在开放列表中
      const existingNode = openList.find(node => node.x === nextPos.x && node.y === nextPos.y)

      if (existingNode) {
        if (g < existingNode.g) {
          existingNode.g = g
          existingNode.f = f
          existingNode.parent = currentNode
        }
      } else {
        openList.push({
          x: nextPos.x,
          y: nextPos.y,
          g,
          h,
          f,
          parent: currentNode,
        })
      }
    }
  }

  return [] // 没有找到路径
}

function autoMove(ball: Ball, path: { x: number; y: number }[], onComplete: () => void) {
  if (path.length === 0) {
    onComplete()
    return
  }

  let currentIndex = 0

  const moveToNext = () => {
    // 检查是否需要中断
    const state = useMazeStore.getState()
    if (state.autoMoveInterrupt) {
      logger.debug('🛑 自动移动被中断')
      useMazeStore.setState({
        isAutoMoving: false,
        autoMoveInterrupt: false,
      })
      return
    }

    if (currentIndex >= path.length) {
      onComplete()
      return
    }

    const target = path[currentIndex]
    const newX = target.x
    const newZ = target.y

    // 更新小球位置和移动次数
    useMazeStore.setState({
      ball: { ...state.ball, x: newX, z: newZ },
      moves: state.moves + 1,
    })

    currentIndex++

    // 延迟执行下一步
    setTimeout(moveToNext, 200)
  }

  moveToNext()
}
