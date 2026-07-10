import { memo, type MouseEvent } from 'react'
import type { Cell, DifficultyConfig } from '../types'

interface MinesweeperBoardProps {
  board: Cell[][]
  config: DifficultyConfig
  onCellClick: (row: number, col: number) => void
  onCellRightClick: (event: MouseEvent<HTMLButtonElement>, row: number, col: number) => void
  onTouchStart: (row: number, col: number) => void
  onTouchEnd: () => void
}

const NUMBER_COLORS = [
  '',
  'text-blue-600',
  'text-green-600',
  'text-red-600',
  'text-purple-600',
  'text-yellow-600',
  'text-pink-600',
  'text-gray-600',
  'text-black',
]

function getCellContent(cell: Cell): string {
  if (cell.state === 'flagged') return '🚩'
  if (cell.state === 'hidden') return ''
  if (cell.isMine) return '💣'
  return cell.neighborCount === 0 ? '' : cell.neighborCount.toString()
}

function getCellStyle(cell: Cell): string {
  const baseStyle =
    'flex size-8 cursor-pointer select-none items-center justify-center border border-gray-400 text-sm font-bold'

  if (cell.state === 'hidden') {
    return `${baseStyle} bg-gray-300 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500`
  }
  if (cell.state === 'flagged') {
    return `${baseStyle} bg-yellow-200 dark:bg-yellow-700`
  }
  if (cell.isMine) {
    return `${baseStyle} bg-red-500 text-white`
  }

  return `${baseStyle} bg-gray-100 dark:bg-gray-700 ${NUMBER_COLORS[cell.neighborCount] ?? ''}`
}

const MinesweeperCell = memo(function MinesweeperCell({
  cell,
  rowIndex,
  colIndex,
  onCellClick,
  onCellRightClick,
  onTouchStart,
  onTouchEnd,
}: Omit<MinesweeperBoardProps, 'board' | 'config'> & {
  cell: Cell
  rowIndex: number
  colIndex: number
}) {
  return (
    <button
      type="button"
      aria-label={`扫雷格子 ${rowIndex + 1}-${colIndex + 1}`}
      className={getCellStyle(cell)}
      onClick={() => onCellClick(rowIndex, colIndex)}
      onContextMenu={event => onCellRightClick(event, rowIndex, colIndex)}
      onTouchStart={() => onTouchStart(rowIndex, colIndex)}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      onMouseDown={event => {
        if (event.button === 1 || event.button === 2) event.preventDefault()
      }}
    >
      {getCellContent(cell)}
    </button>
  )
})

export function MinesweeperBoard({
  board,
  config,
  onCellClick,
  onCellRightClick,
  onTouchStart,
  onTouchEnd,
}: MinesweeperBoardProps) {
  if (board.length === 0 || !board[0]?.length) {
    return (
      <div className="flex h-32 items-center justify-center text-gray-500">正在初始化游戏...</div>
    )
  }

  return (
    <div
      data-testid="minesweeper-board"
      className="grid gap-0"
      style={{
        gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
        maxWidth: `${config.cols * 32}px`,
        touchAction: 'none',
      }}
      onContextMenu={event => event.preventDefault()}
    >
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <MinesweeperCell
            key={`${rowIndex}-${colIndex}`}
            cell={cell}
            rowIndex={rowIndex}
            colIndex={colIndex}
            onCellClick={onCellClick}
            onCellRightClick={onCellRightClick}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          />
        ))
      )}
    </div>
  )
}
