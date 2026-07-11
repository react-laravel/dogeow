import { CircleDollarSign, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/helpers'
import { MAX_HOUSES_PER_PROPERTY } from '../constants'
import type { MonopolyEvent, MonopolyPlayer, MonopolyProperty, MonopolyState } from '../types'
import { Dice } from './Dice'
import { EventLogPanel } from './EventLogPanel'
import { formatMoney } from './MonopolyBoard'

export type MonopolyAnimationPhase = 'idle' | 'rolling' | 'moving' | 'settling'

interface ActiveGamePanelProps {
  room: MonopolyState['room']
  players: MonopolyPlayer[]
  currentPlayer: MonopolyPlayer | null
  me: MonopolyPlayer | null
  playerNetWorth: Map<number, number>
  events: MonopolyEvent[]
  currentProperty: MonopolyProperty | null
  animationPhase: MonopolyAnimationPhase
  diceValue: number
  rolling: boolean
  actionLocked: boolean
  isMyTurn: boolean
  canBuy: boolean
  canBuildCurrent: boolean
  canEndTurn: boolean
  remainingBuildsThisTurn: number
  onOpenAssets: (playerId: number) => void
  onRoll: () => void
  onEndTurn: () => void
  onBuy: () => void
  onBuild: () => void
  onLeaveJail: () => void
}

export function ActiveGamePanel({
  room,
  players,
  currentPlayer,
  me,
  playerNetWorth,
  events,
  currentProperty,
  animationPhase,
  diceValue,
  rolling,
  actionLocked,
  isMyTurn,
  canBuy,
  canBuildCurrent,
  canEndTurn,
  remainingBuildsThisTurn,
  onOpenAssets,
  onRoll,
  onEndTurn,
  onBuy,
  onBuild,
  onLeaveJail,
}: ActiveGamePanelProps) {
  return (
    <div className="grid size-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden [@media_(orientation:landscape)]:grid-cols-[minmax(360px,1fr)_minmax(360px,1fr)] [@media_(orientation:landscape)]:grid-rows-1">
      <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between gap-3 rounded-md bg-white/75 px-3 py-2 dark:bg-stone-950/45">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-stone-950 dark:text-stone-50">
              第 {Math.min(room.round, room.max_rounds)} / {room.max_rounds} 轮 ·{' '}
              {currentPlayer?.name ?? '等待开始'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 [@media_(orientation:landscape)]:grid-cols-2">
          {players.map(player => {
            const isActivePlayer = player.id === currentPlayer?.id
            const netWorth = playerNetWorth.get(player.id) ?? player.cash
            const playerStatus = [
              player.is_in_jail ? '监狱' : null,
              player.is_bankrupt ? '破产' : null,
            ]
              .filter(Boolean)
              .join(' · ')

            return (
              <button
                type="button"
                key={player.id}
                className={cn(
                  'relative min-w-0 overflow-hidden rounded-md bg-white/75 px-2 py-1.5 text-left transition-all duration-200 hover:bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none dark:bg-stone-950/45 dark:hover:bg-stone-900',
                  isActivePlayer &&
                    'bg-amber-50/80 shadow-[inset_3px_0_0_rgb(245,158,11)] dark:bg-amber-950/25'
                )}
                onClick={() => onOpenAssets(player.id)}
                aria-label={`查看${player.name}资产，现金${formatMoney(player.cash)}，总资产${formatMoney(netWorth)}`}
              >
                <div className="truncate text-xs font-medium text-stone-900 dark:text-stone-100">
                  {player.name}
                  {player.type === 'computer' ? ' · 电脑' : ''}
                </div>
                <div className="mt-0.5 truncate font-mono text-sm font-semibold text-stone-950 dark:text-stone-50">
                  {formatMoney(player.cash)}/{formatMoney(netWorth)}
                </div>
                {playerStatus && (
                  <div className="truncate text-[10px] text-stone-500 dark:text-stone-400">
                    {playerStatus}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded-md bg-white/75 p-3 dark:bg-stone-950/45">
          <div className="grid shrink-0 gap-3 [@media_(orientation:landscape)]:grid-cols-[auto_minmax(0,1fr)] [@media_(orientation:landscape)]:items-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-1.5">
                <Dice value={diceValue} rolling={rolling} />
              </div>
              <div className="flex gap-1" aria-hidden="true">
                {(['rolling', 'moving', 'settling'] as const).map(phase => (
                  <span
                    key={phase}
                    className={cn(
                      'h-1 w-4 rounded-full bg-stone-200 transition-colors dark:bg-stone-700',
                      animationPhase === phase && 'bg-amber-500 dark:bg-amber-400'
                    )}
                  />
                ))}
              </div>
              <span className="sr-only" aria-live="polite">
                {animationPhase === 'rolling'
                  ? '正在掷骰子'
                  : animationPhase === 'moving'
                    ? '棋子正在移动'
                    : animationPhase === 'settling'
                      ? '正在结算落地结果'
                      : '等待操作'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                className={cn(!canEndTurn && !canBuy && !canBuildCurrent && 'col-span-2')}
                onClick={onRoll}
                disabled={!isMyTurn || Boolean(me?.last_roll) || actionLocked}
              >
                掷骰子
              </Button>
              {canEndTurn && (
                <Button variant="outline" onClick={onEndTurn} disabled={actionLocked}>
                  结束回合
                </Button>
              )}
              {canBuy && (
                <Button variant="outline" onClick={onBuy} disabled={actionLocked}>
                  购买资产
                </Button>
              )}
              {canBuildCurrent && (
                <Button variant="outline" onClick={onBuild} disabled={actionLocked}>
                  <Home /> 盖房
                </Button>
              )}
              {isMyTurn && me?.is_in_jail && (
                <Button variant="outline" onClick={onLeaveJail} disabled={actionLocked}>
                  支付出狱
                </Button>
              )}
            </div>
          </div>

          {currentProperty && (
            <div className="mt-3 shrink-0 rounded-md bg-stone-50 p-2.5 text-sm text-stone-700 dark:bg-stone-900 dark:text-stone-300">
              <div className="flex items-center gap-2">
                <CircleDollarSign className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="min-w-0">
                  <div className="truncate font-medium">{currentProperty.name}</div>
                  <div className="truncate text-xs text-stone-500 dark:text-stone-400">
                    {formatMoney(currentProperty.price)} · 过路费{' '}
                    {formatMoney(currentProperty.current_rent)} · 房屋 {currentProperty.houses}/
                    {MAX_HOUSES_PER_PROPERTY}
                    {canBuildCurrent ? ` · 可建 ${remainingBuildsThisTurn}` : ''}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <EventLogPanel
        events={events}
        className="rounded-md border border-stone-200 bg-white/75 p-2 dark:border-stone-800 dark:bg-stone-950/45"
      />
    </div>
  )
}
