import type { GameCharacter, GameItem } from '../types'

// Re-export the GameState interface from gameStore for use in helpers
// This is a minimal interface that represents the state properties needed by the helpers
export interface GameStateForHelpers {
  selectedCharacterId: number | null
  isLoading: boolean
  error: string | null
  character: GameCharacter | null
  isFighting: boolean
}

export type SetGameState = (
  updater: (state: GameStateForHelpers) => GameStateForHelpers | Partial<GameStateForHelpers>
) => void

type InventoryEquipmentResponse = Record<
  string,
  { slot?: string; item?: GameItem | null } | GameItem | null
>

export const isGameItem = (data: unknown): data is GameItem => {
  return !!(
    data &&
    typeof data === 'object' &&
    'id' in data &&
    'character_id' in data &&
    'definition_id' in data &&
    'definition' in data &&
    'quality' in data &&
    'quantity' in data
  )
}

export const normalizeEquipmentResponse = (
  equipmentResponse?: InventoryEquipmentResponse
): Record<string, GameItem | null> => {
  const equipment: Record<string, GameItem | null> = {}
  Object.entries(equipmentResponse || {}).forEach(([slot, data]) => {
    if (data && typeof data === 'object' && 'item' in data) {
      const item = data.item
      equipment[slot] = isGameItem(item) ? item : null
      return
    }
    equipment[slot] = isGameItem(data) ? data : null
  })
  return equipment
}

export const getSelectedCharacterIdOrAbort = (
  getState: () => GameStateForHelpers,
  setState: SetGameState,
  options: { context: string; stopLoading?: boolean; warn?: boolean }
): number | null => {
  const { context, stopLoading = true, warn = true } = options
  const selectedId = getState().selectedCharacterId
  if (selectedId) return selectedId

  if (warn) {
    console.warn(`[GameStore] ${context} - no character selected, skipping`)
  }
  if (stopLoading) {
    setState(state => ({ ...state, isLoading: false }))
  }
  return null
}

export const setRequestError = (setState: SetGameState, error: unknown) => {
  setState(state => ({ ...state, error: (error as Error).message, isLoading: false }))
}

export const startRequest = (
  setState: SetGameState,

  extra: Record<string, any> = {}
) => {
  setState(state => ({ ...state, isLoading: true, error: null, ...extra }))
}

export const patchCharacter = (
  character: GameCharacter | null,
  patch: Partial<GameCharacter>
): GameCharacter | null => (character ? { ...character, ...patch } : character)

export const withUpdatedCopper = (
  character: GameCharacter | null,
  copper: number
): GameCharacter | null => patchCharacter(character, { copper })

export const withCombatFlag = (
  state: GameStateForHelpers,
  isFighting: boolean
): Partial<GameStateForHelpers> => ({
  isFighting,
  character: patchCharacter(state.character, { is_fighting: isFighting }),
})

/** 同步更新背包与已装备栏中的同一件物品 */
export const replaceItemInLoadout = (
  inventory: GameItem[],
  equipment: Record<string, GameItem | null>,
  itemId: number,
  updatedItem: GameItem
): { inventory: GameItem[]; equipment: Record<string, GameItem | null> } => {
  const nextInventory = inventory.map(item => (item.id === itemId ? updatedItem : item))
  const nextEquipment: Record<string, GameItem | null> = { ...equipment }

  for (const [slot, item] of Object.entries(nextEquipment)) {
    if (item?.id === itemId) {
      nextEquipment[slot] = updatedItem
    }
  }

  return { inventory: nextInventory, equipment: nextEquipment }
}
