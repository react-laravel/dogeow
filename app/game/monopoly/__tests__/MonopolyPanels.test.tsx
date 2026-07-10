import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActiveGamePanel } from '../components/ActiveGamePanel'
import { FinishedGamePanel } from '../components/FinishedGamePanel'
import { PlayerAssetsPanel } from '../components/PlayerAssetsPanel'
import { WaitingRoomPanel } from '../components/WaitingRoomPanel'
import type { MonopolyPlayer, MonopolyProperty, MonopolyState } from '../types'

const room: MonopolyState['room'] = {
  id: 1,
  name: '周末对局',
  status: 'playing',
  max_players: 4,
  max_rounds: 30,
  current_turn_order: 0,
  round: 3,
  created_by: 1,
}

const player: MonopolyPlayer = {
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
  last_roll: 4,
  houses_built_this_turn: 0,
}

const property: MonopolyProperty = {
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
}

describe('Monopoly panels', () => {
  it('keeps waiting-room host actions behind the host view', () => {
    const onAddComputer = vi.fn()
    const onStart = vi.fn()

    render(
      <WaitingRoomPanel
        room={{ ...room, status: 'waiting' }}
        players={[player]}
        isHost
        loading={false}
        onAddComputer={onAddComputer}
        onStart={onStart}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '创建机器人' }))
    fireEvent.click(screen.getByRole('button', { name: '开始游戏' }))

    expect(onAddComputer).toHaveBeenCalledOnce()
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('forwards active-game controls without owning game logic', () => {
    const onOpenAssets = vi.fn()
    const onEndTurn = vi.fn()
    const onBuy = vi.fn()
    const onBuild = vi.fn()

    render(
      <ActiveGamePanel
        room={room}
        players={[player]}
        currentPlayer={player}
        me={player}
        playerNetWorth={new Map([[player.id, 9000000]])}
        events={[]}
        currentProperty={property}
        animationPhase="idle"
        diceValue={4}
        rolling={false}
        actionLocked={false}
        isMyTurn
        canBuy
        canBuildCurrent
        canEndTurn
        remainingBuildsThisTurn={2}
        onOpenAssets={onOpenAssets}
        onRoll={vi.fn()}
        onEndTurn={onEndTurn}
        onBuy={onBuy}
        onBuild={onBuild}
        onLeaveJail={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /查看玩家A资产/ }))
    fireEvent.click(screen.getByRole('button', { name: '结束回合' }))
    fireEvent.click(screen.getByRole('button', { name: '购买资产' }))
    fireEvent.click(screen.getByRole('button', { name: '盖房' }))

    expect(onOpenAssets).toHaveBeenCalledWith(player.id)
    expect(onEndTurn).toHaveBeenCalledOnce()
    expect(onBuy).toHaveBeenCalledOnce()
    expect(onBuild).toHaveBeenCalledOnce()
  })

  it('keeps asset building limits in the extracted asset panel', () => {
    const onBuild = vi.fn()

    render(
      <PlayerAssetsPanel
        player={player}
        properties={[property]}
        assetValue={1100000}
        netWorth={9100000}
        canBuild
        maxBuildHouses={2}
        onBack={vi.fn()}
        onBuild={onBuild}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '2' }))

    expect(onBuild).toHaveBeenCalledWith(property, 2)
  })

  it('shows the final settlement event in the finished panel', () => {
    render(
      <FinishedGamePanel
        maxRounds={30}
        events={[
          {
            id: 1,
            type: 'game.finished',
            message: '玩家A赢得本局',
            player_id: 1,
            payload: null,
            created_at: '2026-07-10T00:00:00Z',
          },
        ]}
      />
    )

    expect(screen.getAllByText('玩家A赢得本局')).toHaveLength(2)
  })
})
