/**
 * 2048游戏棋盘组件
 */
import { memo } from 'react'
import { Card } from '@/components/ui/card'

interface GameBoardProps {
  board: number[][]
  getTileColor: (value: number) => string
}

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

export const GameBoard = memo(function GameBoard({ board, getTileColor }: GameBoardProps) {
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
