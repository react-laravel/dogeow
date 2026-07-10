'use client'

import { Building2, Gift, HeartHandshake, Lock, Plane, TrainFront, Trophy } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
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

interface BoardLayout {
  cols: number
  rows: number
  cellSize: number
}

const DEFAULT_LAYOUT: BoardLayout = { cols: 9, rows: 7, cellSize: 0 }
const DEFAULT_TILE_COUNT = 28
const MIN_BOARD_SIDE = 5

function perimeterCapacity(cols: number, rows: number): number {
  return cols * 2 + rows * 2 - 4
}

function buildBoardLayoutCandidates(tileCount: number): Array<{ cols: number; rows: number }> {
  const requiredTiles = Math.max(tileCount, DEFAULT_TILE_COUNT)
  const maxSide = Math.max(requiredTiles, DEFAULT_TILE_COUNT)
  const exactLayouts: Array<{ cols: number; rows: number }> = []
  const fallbackLayouts: Array<{ cols: number; rows: number; extraTiles: number }> = []

  for (let cols = MIN_BOARD_SIDE; cols <= maxSide; cols += 1) {
    for (let rows = MIN_BOARD_SIDE; rows <= maxSide; rows += 1) {
      const capacity = perimeterCapacity(cols, rows)
      if (capacity < requiredTiles) continue

      const layout = { cols, rows }
      if (capacity === requiredTiles) {
        exactLayouts.push(layout)
      } else {
        fallbackLayouts.push({ ...layout, extraTiles: capacity - requiredTiles })
      }
    }
  }

  if (exactLayouts.length > 0) return exactLayouts

  const leastExtraTiles = Math.min(...fallbackLayouts.map(layout => layout.extraTiles))

  return fallbackLayouts
    .filter(layout => layout.extraTiles === leastExtraTiles)
    .map(({ cols, rows }) => ({ cols, rows }))
}

export function chooseBoardLayout(
  width: number,
  height: number,
  tileCount = DEFAULT_TILE_COUNT
): BoardLayout {
  if (width <= 0 || height <= 0) return DEFAULT_LAYOUT

  const isPortrait = height > width

  return buildBoardLayoutCandidates(tileCount)
    .map(layout => {
      const cellSize = Math.floor(Math.min(width / layout.cols, height / layout.rows))
      const boardWidth = layout.cols * cellSize
      const boardHeight = layout.rows * cellSize
      const boardArea = boardWidth * boardHeight
      const widthFill = boardWidth / width
      const heightFill = boardHeight / height

      return { ...layout, cellSize, boardWidth, boardHeight, boardArea, widthFill, heightFill }
    })
    .reduce((best, layout) => {
      if (layout.boardArea !== best.boardArea) {
        return layout.boardArea > best.boardArea ? layout : best
      }

      const layoutPrimaryFill = isPortrait ? layout.widthFill : layout.heightFill
      const bestPrimaryFill = isPortrait ? best.widthFill : best.heightFill
      if (layoutPrimaryFill !== bestPrimaryFill) {
        return layoutPrimaryFill > bestPrimaryFill ? layout : best
      }

      if (layout.cellSize !== best.cellSize) {
        return layout.cellSize > best.cellSize ? layout : best
      }

      if (isPortrait && layout.cols !== best.cols) return layout.cols < best.cols ? layout : best
      if (!isPortrait && layout.rows !== best.rows) return layout.rows < best.rows ? layout : best

      return layout
    })
}

function tileGridPosition(index: number, layout: BoardLayout): { row: number; col: number } {
  const lastBottomIndex = layout.cols - 1
  const lastLeftIndex = lastBottomIndex + layout.rows - 1
  const lastTopIndex = lastLeftIndex + layout.cols - 1

  if (index <= lastBottomIndex) return { row: layout.rows, col: layout.cols - index }
  if (index <= lastLeftIndex) return { row: layout.rows - (index - lastBottomIndex), col: 1 }
  if (index <= lastTopIndex) return { row: 1, col: index - lastLeftIndex + 1 }

  return { row: index - lastTopIndex + 1, col: layout.cols }
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
  movingPlayerId,
  highlightedPosition,
  center,
}: {
  board: MonopolyTile[]
  players: MonopolyPlayer[]
  properties: MonopolyProperty[]
  currentPlayerId: number | null
  movingPlayerId?: number | null
  highlightedPosition?: number | null
  center?: ReactNode
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<BoardLayout>(DEFAULT_LAYOUT)
  const propertiesByTile = new Map(properties.map(property => [property.tile_index, property]))

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateLayout = () => {
      const rect = container.getBoundingClientRect()
      setLayout(chooseBoardLayout(rect.width, rect.height, board.length))
    }

    updateLayout()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateLayout)

      return () => window.removeEventListener('resize', updateLayout)
    }

    const observer = new ResizeObserver(updateLayout)
    observer.observe(container)

    return () => observer.disconnect()
  }, [board.length])

  const boardSizeStyle =
    layout.cellSize > 0
      ? {
          width: layout.cols * layout.cellSize,
          height: layout.rows * layout.cellSize,
        }
      : {
          width: '100%',
          height: '100%',
        }

  return (
    <div
      ref={containerRef}
      className="flex size-full items-center justify-center overflow-hidden"
      data-testid="monopoly-board"
    >
      <div
        className="grid gap-1"
        style={{
          ...boardSizeStyle,
          gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
        }}
      >
        <div
          className="min-h-0 overflow-hidden rounded-md bg-white/80 p-3 dark:bg-stone-900/85"
          style={{ gridColumn: `2 / ${layout.cols}`, gridRow: `2 / ${layout.rows}` }}
        >
          {center ?? (
            <div className="flex size-full flex-col items-center justify-center text-center">
              <div className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                DogeOW 地产棋局
              </div>
              <div className="mt-2 max-w-xs text-sm text-stone-600 dark:text-stone-400">
                实时对局 · 城市投资 · 机会与公益福利
              </div>
            </div>
          )}
        </div>
        {board.map(tile => {
          const { row, col } = tileGridPosition(tile.index, layout)
          const property = propertiesByTile.get(tile.index)
          const tilePlayers = players.filter(
            player => player.position === tile.index && !player.is_bankrupt
          )

          return (
            <div
              key={tile.index}
              className={cn(
                'relative flex min-h-0 flex-col overflow-hidden rounded-md border bg-white p-1 text-[11px] shadow-xs transition-[background-color,box-shadow,transform] duration-150 dark:border-stone-700 dark:bg-stone-900',
                highlightedPosition === tile.index &&
                  'animate-[monopoly-tile-pulse_0.5s_ease-in-out_infinite] shadow-[inset_0_0_0_2px_rgb(56_189_248)]',
                currentPlayerId &&
                  tilePlayers.some(player => player.id === currentPlayerId) &&
                  'shadow-[inset_0_0_0_2px_rgb(251_191_36)]'
              )}
              style={{ gridRowStart: row, gridColumnStart: col }}
              data-highlighted={highlightedPosition === tile.index ? 'true' : undefined}
            >
              <div className="flex items-center justify-between gap-1">
                <TileIcon type={tile.type} />
                {property && (
                  <span className="truncate font-mono text-[10px] text-stone-500 dark:text-stone-400">
                    {formatMoney(property.price)}
                  </span>
                )}
              </div>
              {tile.color && (
                <div className="mt-1 h-1 rounded-full" style={{ backgroundColor: tile.color }} />
              )}
              <div
                className="mt-1 truncate font-medium text-stone-900 dark:text-stone-100"
                title={tile.name}
              >
                {tile.name}
              </div>
              {property?.owner_name && (
                <div className="truncate text-[10px] text-stone-500 dark:text-stone-400">
                  {property.owner_name}
                </div>
              )}
              {property?.houses ? (
                <div className="mt-auto flex gap-0.5" aria-label={`${property.houses} 套房`}>
                  {Array.from({ length: property.houses }, (_, index) => (
                    <span
                      key={index}
                      className="size-1.5 rounded-[2px] bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.45)]"
                    />
                  ))}
                </div>
              ) : null}
              <div className="absolute right-1 bottom-1 flex max-w-[70%] flex-wrap justify-end gap-0.5">
                {tilePlayers.map(player => (
                  <span
                    key={player.id}
                    title={player.name}
                    className={cn(
                      'grid size-[clamp(14px,2.2vmin,20px)] place-items-center rounded-full border border-white text-[9px] font-bold text-white shadow-md transition-transform',
                      player.id === currentPlayerId && 'ring-1 ring-amber-300 ring-offset-1',
                      movingPlayerId === player.id &&
                        'animate-[monopoly-token-hop_0.19s_ease-out] ring-2 ring-sky-300 ring-offset-1'
                    )}
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
