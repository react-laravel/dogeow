/**
 * 2048游戏棋盘组件
 */
import { memo } from 'react'
import { Card } from '@/components/ui/card'

interface GameBoardProps {
  board: number[][]
}

const TILE_COLOR_CLASSES: Record<number, string> = {
  0: 'bg-gray-100 dark:bg-gray-800',
  2: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
  4: 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-100',
  8: 'bg-orange-200 text-orange-800 dark:bg-orange-700 dark:text-orange-100',
  16: 'bg-orange-300 text-orange-900 dark:bg-orange-600 dark:text-orange-100',
  32: 'bg-orange-400 text-white dark:bg-orange-500',
  64: 'bg-red-400 text-white dark:bg-red-500',
  128: 'bg-yellow-300 text-yellow-900 dark:bg-yellow-600 dark:text-yellow-100',
  256: 'bg-yellow-400 text-yellow-900 dark:bg-yellow-500 dark:text-yellow-100',
  512: 'bg-yellow-500 text-white dark:bg-yellow-400 dark:text-yellow-900',
  1024: 'bg-green-400 text-white dark:bg-green-500',
  2048: 'bg-green-500 text-white dark:bg-green-400 shadow-lg shadow-green-500/50',
}

const getTileColor = (value: number) =>
  TILE_COLOR_CLASSES[value] ??
  'bg-purple-500 text-white dark:bg-purple-400 shadow-lg shadow-purple-500/50'

const TileCell = memo(function TileCell({
  value,
  colorClass,
}: {
  value: number
  colorClass: string
}) {
  return (
    <div
      className={`flex aspect-square items-center justify-center rounded-lg ${value >= 1000 ? 'text-sm' : value >= 100 ? 'text-base' : 'text-lg'} font-bold transition-all duration-200 ease-in-out ${colorClass} ${value !== 0 ? 'scale-100' : 'scale-95'} hover:scale-105`}
    >
      {value !== 0 && <span className="animate-in fade-in-0 zoom-in-95 duration-200">{value}</span>}
    </div>
  )
})

export const GameBoard = memo(function GameBoard({ board }: GameBoardProps) {
  return (
    <Card className="mb-4 p-4">
      <div className="grid grid-cols-4 gap-2" style={{ touchAction: 'none' }} data-game-board>
        {board.map((row, i) =>
          row.map((cell, j) => (
            <TileCell key={`${i}-${j}`} value={cell} colorClass={getTileColor(cell)} />
          ))
        )}
      </div>
    </Card>
  )
})
