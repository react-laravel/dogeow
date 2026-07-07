import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MonopolyBoard } from '../components/MonopolyBoard'
import type { MonopolyPlayer, MonopolyProperty, MonopolyTile } from '../types'

const board: MonopolyTile[] = [
  { index: 0, type: 'start', name: '起点' },
  { index: 1, type: 'city', name: '罗马', color: '#d64f45' },
  { index: 2, type: 'chance', name: '机会' },
  { index: 3, type: 'city', name: '东京', color: '#2563eb' },
  { index: 4, type: 'rail', name: '铁路' },
  { index: 5, type: 'air', name: '航空' },
]

const players: MonopolyPlayer[] = [
  {
    id: 1,
    user_id: 1,
    name: '玩家A',
    type: 'human',
    turn_order: 0,
    cash: 800000,
    position: 1,
    tile_name: '罗马',
    is_host: true,
    is_bankrupt: false,
    is_in_jail: false,
    jail_turns: 0,
    jail_cards: 0,
    last_roll: null,
  },
]

const properties: MonopolyProperty[] = [
  {
    id: 1,
    tile_index: 1,
    type: 'city',
    name: '罗马',
    price: 180000,
    base_rent: 28000,
    house_price: 90000,
    owner_player_id: 1,
    owner_name: '玩家A',
    houses: 2,
  },
]

describe('MonopolyBoard', () => {
  it('renders a square board with tiles and player markers', () => {
    render(
      <MonopolyBoard board={board} players={players} properties={properties} currentPlayerId={1} />
    )

    const boardElement = screen.getByTestId('monopoly-board')
    expect(boardElement).toHaveClass('aspect-square')
    expect(screen.getByText('罗马')).toBeInTheDocument()
    expect(screen.getByText('玩家A')).toBeInTheDocument()
    expect(within(boardElement).getByTitle('玩家A')).toBeInTheDocument()
  })
})
