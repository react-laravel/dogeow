import { Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MonopolyPlayer, MonopolyState } from '../types'

interface WaitingRoomPanelProps {
  room: MonopolyState['room']
  players: MonopolyPlayer[]
  isHost: boolean
  loading: boolean
  onAddComputer: () => void
  onStart: () => void
}

export function WaitingRoomPanel({
  room,
  players,
  isHost,
  loading,
  onAddComputer,
  onStart,
}: WaitingRoomPanelProps) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 overflow-hidden rounded-md bg-white/75 p-3 text-center dark:bg-stone-950/45">
      <div className="min-w-0 max-w-full">
        <div className="truncate text-base font-semibold text-stone-950 dark:text-stone-50">
          {room.name}
        </div>
        <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          {players.length}/{room.max_players} 人
        </div>
      </div>

      <div className="min-h-0 w-full max-w-sm overflow-hidden">
        <div className="grid max-h-full grid-cols-2 justify-center gap-2 overflow-auto sm:grid-cols-3">
          {players.map(player => (
            <div
              key={player.id}
              className="min-w-0 rounded-md bg-stone-50 px-2 py-2 text-center dark:bg-stone-900"
            >
              <div className="truncate text-sm font-medium text-stone-950 dark:text-stone-50">
                {player.name}
              </div>
              <div className="mt-0.5 truncate text-xs text-stone-500 dark:text-stone-400">
                {player.type === 'computer' ? '电脑' : player.is_host ? '房主' : '玩家'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-sm shrink-0">
        <div className="text-sm text-stone-500 dark:text-stone-400">
          {isHost ? '添加电脑或开始游戏' : '等待房主开始游戏'}
        </div>
        {isHost && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              className="min-w-28 flex-1 whitespace-nowrap"
              onClick={onAddComputer}
              disabled={loading}
            >
              <Bot /> 创建机器人
            </Button>
            <Button
              className="min-w-24 flex-1 whitespace-nowrap"
              onClick={onStart}
              disabled={loading}
            >
              开始游戏
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
