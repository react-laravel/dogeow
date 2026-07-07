'use client'

import { Building2, Gift, HeartHandshake, Lock, Plane, TrainFront, Trophy } from 'lucide-react'
import { cn } from '@/lib/helpers'
import type { MonopolyPlayer, MonopolyProperty, MonopolyTile } from '../types'

const playerColors = [
  '#ef4444',
  '#2563eb',
  '#16a34a',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#475569',
]

function tileGridPosition(index: number): { row: number; col: number } {
  if (index <= 5) return { row: 6, col: 6 - index }
  if (index <= 10) return { row: 11 - index, col: 1 }
  if (index <= 15) return { row: 1, col: index - 10 }
  return { row: index - 15, col: 6 }
}

function TileIcon({ type }: { type: MonopolyTile['type'] }) {
  const className = 'size-4'
  if (type === 'start') return <Trophy className={className} />
  if (type === 'rail') return <TrainFront className={className} />
  if (type === 'air') return <Plane className={className} />
  if (type === 'chance') return <Gift className={className} />
  if (type === 'welfare') return <HeartHandshake className={className} />
  if (type === 'jail') return <Lock className={className} />
  return <Building2 className={className} />
}

export function MonopolyBoard({
  board,
  players,
  properties,
  currentPlayerId,
}: {
  board: MonopolyTile[]
  players: MonopolyPlayer[]
  properties: MonopolyProperty[]
  currentPlayerId: number | null
}) {
  const propertiesByTile = new Map(properties.map(property => [property.tile_index, property]))

  return (
    <div className="mx-auto aspect-square w-full max-w-[760px]" data-testid="monopoly-board">
      <div className="grid size-full grid-cols-6 grid-rows-6 gap-1 rounded-md border bg-stone-100 p-1 shadow-sm">
        <div className="col-start-2 col-end-6 row-start-2 row-end-6 flex flex-col items-center justify-center rounded-md border border-dashed border-stone-300 bg-white/70 p-4 text-center">
          <div className="text-xl font-semibold text-stone-900">DogeOW 大富翁</div>
          <div className="mt-2 max-w-xs text-sm text-stone-600">
            实时房间 · 城市投资 · 机会与公益福利
          </div>
        </div>
        {board.map(tile => {
          const { row, col } = tileGridPosition(tile.index)
          const property = propertiesByTile.get(tile.index)
          const tilePlayers = players.filter(
            player => player.position === tile.index && !player.is_bankrupt
          )

          return (
            <div
              key={tile.index}
              className={cn(
                'relative flex min-h-0 flex-col overflow-hidden rounded-md border bg-white p-1 text-[11px] shadow-xs',
                currentPlayerId &&
                  tilePlayers.some(player => player.id === currentPlayerId) &&
                  'ring-2 ring-amber-400'
              )}
              style={{ gridRowStart: row, gridColumnStart: col }}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] text-stone-400">{tile.index}</span>
                <TileIcon type={tile.type} />
              </div>
              {tile.color && (
                <div className="mt-1 h-1 rounded-full" style={{ backgroundColor: tile.color }} />
              )}
              <div className="mt-1 truncate font-medium text-stone-900" title={tile.name}>
                {tile.name}
              </div>
              {property && (
                <div className="truncate text-[10px] text-stone-500">
                  {property.owner_name ? property.owner_name : `${formatMoney(property.price)}`}
                </div>
              )}
              {property?.houses ? (
                <div className="mt-auto text-[10px] text-emerald-700">
                  {'■'.repeat(property.houses)}
                </div>
              ) : null}
              <div className="absolute right-1 bottom-1 flex max-w-[70%] flex-wrap justify-end gap-0.5">
                {tilePlayers.map(player => (
                  <span
                    key={player.id}
                    title={player.name}
                    className="grid size-4 place-items-center rounded-full border border-white text-[9px] font-bold text-white shadow"
                    style={{
                      backgroundColor: playerColors[player.turn_order % playerColors.length],
                    }}
                  >
                    {player.name.slice(0, 1)}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function formatMoney(value: number): string {
  if (Math.abs(value) >= 1_000_000)
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(value)
}
