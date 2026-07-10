export type MonopolyRoomStatus = 'waiting' | 'playing' | 'finished'
export type MonopolyTileType = 'start' | 'city' | 'rail' | 'air' | 'chance' | 'welfare' | 'jail'
export type MonopolyPlayerType = 'human' | 'computer'

export interface MonopolyTile {
  index: number
  type: MonopolyTileType
  name: string
  icon?: string
  price?: number
  rent?: number
  house_price?: number
  color?: string
}

export interface MonopolyPlayer {
  id: number
  user_id: number | null
  name: string
  type: MonopolyPlayerType
  turn_order: number
  cash: number
  position: number
  tile_name: string
  is_host: boolean
  is_bankrupt: boolean
  is_in_jail: boolean
  jail_turns: number
  jail_cards: number
  last_roll: number | null
  houses_built_this_turn: number
}

export interface MonopolyProperty {
  id: number
  tile_index: number
  type: 'city' | 'rail' | 'air'
  name: string
  price: number
  base_rent: number
  current_rent: number
  house_price: number
  owner_player_id: number | null
  owner_name: string | null
  houses: number
}

export interface MonopolyEvent {
  id: number
  type: string
  message: string
  player_id: number | null
  payload: Record<string, unknown> | null
  created_at: string
}

export interface MonopolyState {
  room: {
    id: number
    name: string
    status: MonopolyRoomStatus
    max_players: number
    max_rounds: number
    current_turn_order: number
    round: number
    created_by: number
  }
  current_player_id: number | null
  board: MonopolyTile[]
  players: MonopolyPlayer[]
  properties: MonopolyProperty[]
  events: MonopolyEvent[]
}

export interface MonopolyRollAnimation {
  player_id: number
  roll: number
  state: MonopolyState
}

export interface MonopolyRoomSummary {
  id: number
  name: string
  status: MonopolyRoomStatus
  players_count: number
  max_players: number
  is_member: boolean
  created_at: string
}
