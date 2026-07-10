import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MonopolyBoard, chooseBoardLayout } from '../components/MonopolyBoard'
import type { MonopolyPlayer, MonopolyProperty, MonopolyTile } from '../types'

const board: MonopolyTile[] = [
  { index: 0, type: 'start', name: '起点' },
  { index: 1, type: 'city', name: '罗马', color: '#d64f45' },
  { index: 2, type: 'chance', name: '机会' },
  { index: 3, type: 'city', name: '东京', color: '#2563eb' },
  { index: 4, type: 'rail', name: '铁路' },
  { index: 5, type: 'air', name: '航空' },
  { index: 6, type: 'welfare', name: '公益福利' },
  { index: 7, type: 'city', name: '巴黎', color: '#e0a83a' },
  { index: 8, type: 'city', name: '伦敦', color: '#e0a83a' },
  { index: 9, type: 'city', name: '纽约', color: '#2563eb' },
]

const players: MonopolyPlayer[] = [
  {
    id: 1,
    user_id: 1,
    name: '玩家A',
    type: 'human',
    turn_order: 0,
    cash: 8000000,
    position: 1,
    tile_name: '罗马',
    is_host: true,
    is_bankrupt: false,
    is_in_jail: false,
    jail_turns: 0,
    jail_cards: 0,
    last_roll: null,
    houses_built_this_turn: 0,
  },
]

const properties: MonopolyProperty[] = [
  {
    id: 1,
    tile_index: 1,
    type: 'city',
    name: '罗马',
    price: 100000,
    base_rent: 10000,
    current_rent: 10000,
    house_price: 500000,
    owner_player_id: 1,
    owner_name: '玩家A',
    houses: 2,
  },
]

describe('MonopolyBoard', () => {
  it('renders a responsive rectangular board with tiles and player markers', () => {
    render(
      <MonopolyBoard board={board} players={players} properties={properties} currentPlayerId={1} />
    )

    const boardElement = screen.getByTestId('monopoly-board')
    expect(boardElement).toHaveClass('size-full')
    expect(screen.getByText('罗马')).toBeInTheDocument()
    expect(screen.getByText('玩家A')).toBeInTheDocument()
    expect(within(boardElement).getByTitle('玩家A')).toBeInTheDocument()
  })

  it('marks the moving player and highlighted tile during movement animation', () => {
    render(
      <MonopolyBoard
        board={board}
        players={players}
        properties={properties}
        currentPlayerId={null}
        movingPlayerId={1}
        highlightedPosition={1}
      />
    )

    const boardElement = screen.getByTestId('monopoly-board')
    const tile = screen.getByText('罗马').closest('div.relative')
    const marker = within(boardElement).getByTitle('玩家A')

    expect(tile).toHaveClass('shadow-[inset_0_0_0_2px_rgb(56_189_248)]')
    expect(marker.getAttribute('class')).toContain('monopoly-token-hop')
  })

  it('chooses a board shape that fills the available viewport while keeping square cells', () => {
    expect(chooseBoardLayout(1270, 510)).toMatchObject({ cols: 11, rows: 5 })
    expect(chooseBoardLayout(820, 1420)).toMatchObject({ cols: 6, rows: 10 })
  })
})
