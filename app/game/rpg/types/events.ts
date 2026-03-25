// WebSocket event types for RPG game

import type { CombatMonster, CombatResult } from './combat'
import type { GameCharacter } from './character'
import type { GameItem } from './item'

/** 怪物出现事件数据 */
export interface GameMonstersAppearEvent {
  type: 'monsters_appear'
  monsters: CombatMonster[]
  character: {
    current_hp: number
    current_mana: number
  }
}

/** 战斗更新事件数据 */
export interface GameCombatUpdateEvent extends CombatResult {
  type?: string
  current_hp?: number
  current_mana?: number
}

/** 战利品掉落事件数据 */
export interface GameLootDroppedEvent {
  type: 'loot_dropped'
  item?: GameItem
  copper?: number
  character?: {
    current_hp?: number
    current_mana?: number
  }
}

/** 升级事件数据 */
export interface GameLevelUpEvent {
  type: 'level_up'
  character: GameCharacter
}

/** 背包更新事件数据 */
export interface GameInventoryUpdateEvent {
  type: 'inventory_update'
  inventory?: GameItem[]
  storage?: GameItem[]
  equipment?: Record<string, GameItem | null>
  inventory_size?: number
  storage_size?: number
}
