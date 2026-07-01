// 游戏状态管理

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StateCreator } from 'zustand'
import {
  GameCharacter,
  CombatStats,
  CombatStatsBreakdown,
  CombatMonster,
  CombatResult,
  CombatLog,
  CombatLogDetail,
  GameItem,
  CharacterSkill,
  SkillWithLearnedState,
  MapDefinition,
  CharacterMap,
  EquipmentSlot,
  CompendiumItem,
  CompendiumMonster,
  CompendiumMonsterDrops,
  GameMonstersAppearEvent,
  GameCombatUpdateEvent,
  GameLootDroppedEvent,
  GameLevelUpEvent,
} from '../types'
import { apiGet, apiRequest, post, put, del } from '@/lib/api'
import { soundManager } from '../utils/soundManager'

// Imports from extracted helpers
import {
  reportCombatDebug,
  extractCombatLogId,
  mergeCombatLogsWithUpdate,
  type CombatLogEntry,
} from './combatHelpers'
import {
  normalizeEquipmentResponse,
  getSelectedCharacterIdOrAbort,
  setRequestError,
  startRequest,
  patchCharacter,
  withUpdatedCopper,
  withCombatFlag,
  replaceItemInLoadout,
} from './gameStateHelpers'

let startCombatInFlight = false

/** 进入/传送地图接口响应 */
interface EnterMapResponse {
  character: GameCharacter
  map?: MapDefinition
  monsters?: CombatMonster[]
}

interface GameState {
  // 角色数据
  characters: GameCharacter[]
  character: GameCharacter | null
  selectedCharacterId: number | null
  experienceTable: Record<number, number> // 等级 -> 累计经验，由后端提供
  combatStats: CombatStats | null
  statsBreakdown: CombatStatsBreakdown | null // 攻击/防御等属性明细（基础+装备）
  currentHp: number | null // 当前HP
  currentMana: number | null // 当前Mana
  inventory: GameItem[]
  storage: GameItem[]
  /** 背包格位数（由后端 /rpg/inventory 返回） */
  inventorySize: number
  /** 仓库格位数（由后端 /rpg/inventory 返回） */
  storageSize: number
  equipment: Record<string, GameItem | null>
  skills: SkillWithLearnedState[]
  maps: MapDefinition[]
  currentMap: MapDefinition | null

  // 战斗状态
  isFighting: boolean
  shouldAutoCombat: boolean // 是否应该自动战斗（不管在哪个标签页）
  combatResult: CombatResult | null
  /** 刷新页面时由 combat/status 返回的当前怪物列表，用于在未收到 WebSocket 回合前显示怪物 */
  statusCombatMonsters: (CombatMonster | null)[] | null
  combatLogs: (CombatResult | CombatLog)[]
  /** WebSocket 回合推送先缓存，等战斗场景动画结算后再写入 combatLogs */
  pendingCombatLog: CombatLogEntry | null
  combatLogDetail: CombatLogDetail | null // 选中的战斗日志详情

  // UI状态
  isLoading: boolean
  error: string | null
  activeTab: 'character' | 'inventory' | 'skills' | 'maps' | 'combat' | 'settings' | 'compendium'

  compareEquippedCollapsed: boolean

  // 图鉴状态
  compendiumItems: CompendiumItem[]
  compendiumMonsters: CompendiumMonster[]
  compendiumMonsterDrops: CompendiumMonsterDrops | null

  // Actions
  setActiveTab: (
    tab: 'character' | 'inventory' | 'skills' | 'maps' | 'combat' | 'settings' | 'compendium'
  ) => void
  setCompareEquippedCollapsed: (collapsed: boolean) => void
  toggleCompareEquippedCollapsed: () => void
  fetchCharacters: () => Promise<void>
  selectCharacter: (characterId: number) => Promise<void>
  fetchCharacter: () => Promise<void>
  createCharacter: (
    name: string,
    characterClass: string,
    gender?: 'male' | 'female'
  ) => Promise<void>
  deleteCharacter: (characterId: number) => Promise<void>
  allocateStats: (stats: Record<string, number>) => Promise<void>
  setDifficulty: (difficultyTier: number) => Promise<void>
  setDifficultyForCharacter: (characterId: number, difficultyTier: number) => Promise<void>
  setCharacter: (updater: (prev: GameCharacter | null) => GameCharacter | null) => void
  // 背包操作
  fetchInventory: () => Promise<void>
  equipItem: (itemId: number) => Promise<void>
  unequipItem: (slot: EquipmentSlot) => Promise<void>
  sellItem: (itemId: number, quantity?: number) => Promise<void>
  sellItemsByQuality: (quality: string) => Promise<{ count: number; total_price: number }>
  updateAutoRecycleSettings: (maxValue: number | null) => Promise<void>
  moveItem: (itemId: number, toStorage: boolean, slotIndex?: number) => Promise<void>
  sortInventory: (sortBy: 'quality' | 'price' | 'default', inStorage?: boolean) => Promise<void>
  socketGem: (itemId: number, gemItemId: number, socketIndex: number) => Promise<void>
  unsocketGem: (itemId: number, socketIndex: number) => Promise<void>

  // 技能操作
  fetchSkills: () => Promise<void>
  learnSkill: (skillId: number) => Promise<void>

  // 地图操作
  fetchMaps: () => Promise<void>
  enterMap: (mapId: number) => Promise<void>
  teleportToMap: (mapId: number) => Promise<void>

  // 战斗操作
  fetchCombatStatus: () => Promise<void>
  fetchCombatLogs: () => Promise<void>
  fetchCombatLogDetail: (logId: number) => Promise<void>
  clearCombatLogDetail: () => void
  startCombat: () => Promise<void>
  revive: () => Promise<void>
  stopCombat: () => Promise<void>
  setShouldAutoCombat: (should: boolean) => void // 设置是否应该自动战斗
  /** 已启用的技能 id 列表，可多选；自动战斗时会按顺序尝试施放 */
  enabledSkillIds: number[]
  toggleEnabledSkill: (skillId: number) => void

  // WebSocket 事件处理
  handleMonstersAppear: (data: unknown) => void // 怪物出现
  handleCombatUpdate: (data: unknown) => void
  flushPendingCombatLog: () => void
  handleLootDropped: (data: unknown) => void
  handleLevelUp: (data: unknown) => void
  /** 从 WebSocket inventory.update 直接更新背包/仓库/装备，不再发 HTTP 请求 */
  handleInventoryUpdate: (data: {
    inventory?: GameItem[]
    storage?: GameItem[]
    equipment?: Record<string, GameItem | null>
    inventory_size?: number
    storage_size?: number
  }) => void

  // 图鉴操作
  fetchCompendiumItems: () => Promise<void>
  fetchCompendiumMonsters: () => Promise<void>
  fetchCompendiumMonsterDrops: (monsterId: number) => Promise<void>
  clearCompendiumMonsterDrops: () => void

  // 工具
  clearError: () => void
  reset: () => void
}

/** 若当前无启用技能，则默认启用所有已学习的主动技能 */
function resolveEnabledSkillIds(
  skills: SkillWithLearnedState[],
  currentEnabledIds: number[]
): number[] {
  if (currentEnabledIds.length > 0) return currentEnabledIds
  return skills
    .filter(
      s =>
        s.is_learned &&
        s.type === 'active' &&
        (s.node_tier === 0 || s.node_tier === undefined || s.node_tier === null)
    )
    .map(s => s.id)
}

const initialState = {
  characters: [],
  character: null,
  selectedCharacterId: null,
  experienceTable: {} as Record<number, number>,
  combatStats: null,
  statsBreakdown: null,
  currentHp: null,
  currentMana: null,
  inventory: [],
  storage: [],
  inventorySize: 50,
  storageSize: 50,
  equipment: {},
  skills: [],
  availableSkills: [],
  maps: [],
  currentMap: null,
  isFighting: false,
  shouldAutoCombat: false, // 是否应该自动战斗
  enabledSkillIds: [] as number[], // 已启用的技能，可多选
  combatResult: null,
  statusCombatMonsters: null,
  combatLogs: [],
  pendingCombatLog: null,
  combatLogDetail: null, // 选中的战斗日志详情
  isLoading: false,
  error: null,
  activeTab: 'character' as const,
  compareEquippedCollapsed: false,
  compendiumItems: [],
  compendiumMonsters: [],
  compendiumMonsterDrops: null,
}

const store: StateCreator<GameState> = (set, get) => ({
  ...initialState,

  setActiveTab: tab => set(state => ({ ...state, activeTab: tab })),

  setCompareEquippedCollapsed: collapsed =>
    set(state => ({ ...state, compareEquippedCollapsed: collapsed })),

  toggleCompareEquippedCollapsed: () =>
    set(state => ({ ...state, compareEquippedCollapsed: !state.compareEquippedCollapsed })),

  fetchCharacters: async () => {
    set(state => ({ ...state, error: null }))
    try {
      const response = (await apiGet('/rpg/characters')) as {
        characters: GameCharacter[]
        experience_table?: Record<number, number>
        message?: string
      }
      set(state => ({
        ...state,
        characters: Array.isArray(response?.characters) ? response.characters : [],
        experienceTable: response?.experience_table ?? state.experienceTable,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch characters error:', error)
      set(state => ({
        ...state,
        error: (error as Error).message,
        characters: [],
      }))
    }
  },

  selectCharacter: async characterId => {
    startRequest(set)
    try {
      // 设置选中的角色ID
      set(state => ({ ...state, selectedCharacterId: characterId }))
      // 更新在线时间
      await post('/rpg/character/online', { character_id: characterId })
      // 获取该角色的详细信息
      await get().fetchCharacter()
    } catch (error) {
      console.error('[GameStore] Select character error:', error)
      setRequestError(set, error)
    }
  },

  fetchCharacter: async () => {
    startRequest(set)
    try {
      const selectedId = get().selectedCharacterId
      const params = selectedId ? `?character_id=${selectedId}` : ''
      const response = (await apiGet(`/rpg/character${params}`)) as {
        character: GameCharacter | null
        experience_table?: Record<number, number>
        combat_stats?: CombatStats
        stats_breakdown?: CombatStatsBreakdown
        current_hp?: number
        current_mana?: number
      }
      set(state => ({
        ...state,
        character: response.character,
        experienceTable: response.experience_table ?? state.experienceTable,
        combatStats: response.combat_stats || null,
        statsBreakdown: response.stats_breakdown ?? null,
        currentHp: response.current_hp ?? null,
        currentMana: response.current_mana ?? null,
        isLoading: false,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch character error:', error)
      setRequestError(set, error)
    }
  },

  createCharacter: async (name, characterClass, gender = 'male') => {
    startRequest(set)
    try {
      const response = (await post('/rpg/character', {
        name,
        class: characterClass,
        gender,
      })) as {
        character: GameCharacter
        combat_stats: CombatStats
        stats_breakdown?: CombatStatsBreakdown
      }
      set(state => ({
        ...state,
        characters: [...(state.characters || []), response.character],
        combatStats: response.combat_stats,
        statsBreakdown: response.stats_breakdown ?? null,
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  deleteCharacter: async characterId => {
    startRequest(set)
    try {
      await del(`/rpg/character?character_id=${characterId}`)
      set(state => {
        const nextCharacters = (state.characters || []).filter(c => c.id !== characterId)
        const wasSelected = state.selectedCharacterId === characterId
        return {
          ...state,
          characters: nextCharacters,
          ...(wasSelected
            ? {
                selectedCharacterId: null,
                character: null,
                combatStats: null,
                statsBreakdown: null,
                currentHp: null,
                currentMana: null,
                inventory: [],
                equipment: {},
                skills: [],
                currentMap: null,
                combatResult: null,
                combatLogs: [],
                isFighting: false,
                shouldAutoCombat: false,
              }
            : {}),
          isLoading: false,
        }
      })
      // 删除角色后清除 localStorage 中的游戏状态
      useGameStore.persist.clearStorage()
    } catch (error) {
      setRequestError(set, error)
    }
  },

  allocateStats: async stats => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'allocateStats',
        warn: false,
      })
      if (!selectedId) return
      const response = (await put('/rpg/character/stats', {
        ...stats,
        character_id: selectedId,
      })) as {
        character: GameCharacter
        combat_stats: CombatStats
        stats_breakdown?: CombatStatsBreakdown
        current_hp: number
        current_mana: number
      }
      set(state => ({
        ...state,
        character: response.character,
        combatStats: response.combat_stats,
        statsBreakdown: response.stats_breakdown ?? null,
        currentHp: response.current_hp,
        currentMana: response.current_mana,
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  setDifficulty: async difficultyTier => {
    const selectedId = get().selectedCharacterId
    if (selectedId == null) return
    startRequest(set)
    try {
      const response = (await put('/rpg/character/difficulty', {
        character_id: selectedId,
        difficulty_tier: difficultyTier,
      })) as { character: GameCharacter }
      set(state => ({
        ...state,
        character: state.character
          ? { ...state.character, ...response.character }
          : response.character,
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  setDifficultyForCharacter: async (characterId, difficultyTier) => {
    set(state => ({ ...state, error: null }))
    try {
      const response = (await put('/rpg/character/difficulty', {
        character_id: characterId,
        difficulty_tier: difficultyTier,
      })) as { character: GameCharacter }
      set(state => ({
        ...state,
        characters: (state.characters ?? []).map(c =>
          c.id === characterId ? { ...c, difficulty_tier: response.character.difficulty_tier } : c
        ),
        character:
          state.character?.id === characterId
            ? { ...state.character, difficulty_tier: response.character.difficulty_tier }
            : state.character,
      }))
    } catch (error) {
      set(state => ({ ...state, error: (error as Error).message }))
    }
  },

  setCharacter: updater => {
    set(state => ({
      ...state,
      character: updater(state.character),
    }))
  },

  fetchInventory: async () => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, { context: 'fetchInventory' })
      if (!selectedId) return
      const params = `?character_id=${selectedId}`
      const response = (await apiGet(`/rpg/inventory${params}`)) as {
        inventory: GameItem[]
        storage: GameItem[]
        equipment: Record<string, { slot: string; item: GameItem | null }>
        inventory_size?: number
        storage_size?: number
      }
      const equipment = normalizeEquipmentResponse(response.equipment)
      set(state => ({
        ...state,
        inventory: response.inventory || [],
        storage: response.storage || [],
        inventorySize:
          typeof response.inventory_size === 'number'
            ? response.inventory_size
            : state.inventorySize,
        storageSize:
          typeof response.storage_size === 'number' ? response.storage_size : state.storageSize,
        equipment,
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  equipItem: async itemId => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'equipItem',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/inventory/equip', {
        item_id: itemId,
        character_id: selectedId,
      })) as {
        equipped_item: GameItem
        equipped_slot: string
        unequipped_item: GameItem | null
        combat_stats: CombatStats
        stats_breakdown?: CombatStatsBreakdown
      }
      soundManager.play('equip')

      const currentInventory = get().inventory
      const updatedInventory = [...currentInventory]
      if (response.unequipped_item) {
        updatedInventory.push(response.unequipped_item)
      }
      const filteredInventory = updatedInventory.filter(i => i.id !== itemId)

      set(state => ({
        ...state,
        inventory: filteredInventory,
        equipment: {
          ...state.equipment,
          [response.equipped_slot]: response.equipped_item,
        },
        combatStats: response.combat_stats,
        statsBreakdown: response.stats_breakdown ?? state.statsBreakdown,
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  unequipItem: async slot => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'unequipItem',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/inventory/unequip', {
        slot,
        character_id: selectedId,
      })) as {
        item: GameItem
        combat_stats: CombatStats
        stats_breakdown?: CombatStatsBreakdown
      }
      set(state => ({
        ...state,
        inventory: [...state.inventory, response.item],
        equipment: {
          ...state.equipment,
          [slot]: null,
        },
        combatStats: response.combat_stats,
        statsBreakdown: response.stats_breakdown ?? state.statsBreakdown,
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  socketGem: async (itemId, gemItemId, socketIndex) => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'socketGem',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/gems/socket', {
        item_id: itemId,
        gem_item_id: gemItemId,
        socket_index: socketIndex,
        character_id: selectedId,
      })) as {
        equipment: GameItem
        combat_stats?: CombatStats
        stats_breakdown?: CombatStatsBreakdown
        message: string
      }

      set(state => {
        const { inventory, equipment } = replaceItemInLoadout(
          state.inventory,
          state.equipment,
          itemId,
          response.equipment
        )

        return {
          ...state,
          inventory: inventory.filter(item => item.id !== gemItemId),
          equipment,
          combatStats: response.combat_stats ?? state.combatStats,
          statsBreakdown: response.stats_breakdown ?? state.statsBreakdown,
          isLoading: false,
        }
      })
    } catch (error) {
      setRequestError(set, error)
    }
  },

  unsocketGem: async (itemId, socketIndex) => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'unsocketGem',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/gems/unsocket', {
        item_id: itemId,
        socket_index: socketIndex,
        character_id: selectedId,
      })) as {
        equipment: GameItem
        gem_item?: GameItem
        combat_stats?: CombatStats
        stats_breakdown?: CombatStatsBreakdown
        message: string
      }

      set(state => {
        const { inventory, equipment } = replaceItemInLoadout(
          state.inventory,
          state.equipment,
          itemId,
          response.equipment
        )
        const returnedGem = response.gem_item
        const hasReturnedGem =
          returnedGem != null && inventory.some(item => item.id === returnedGem.id)

        return {
          ...state,
          inventory: returnedGem && !hasReturnedGem ? [...inventory, returnedGem] : inventory,
          equipment,
          combatStats: response.combat_stats ?? state.combatStats,
          statsBreakdown: response.stats_breakdown ?? state.statsBreakdown,
          isLoading: false,
        }
      })
    } catch (error) {
      setRequestError(set, error)
    }
  },

  sellItem: async (itemId, quantity = 1) => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'sellItem',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/inventory/sell', {
        item_id: itemId,
        quantity,
        character_id: selectedId,
      })) as { copper: number; sell_price: number }
      soundManager.play('gold')
      set(state => ({
        ...state,
        character: withUpdatedCopper(state.character, response.copper),
        inventory: state.inventory.filter(i => i.id !== itemId),
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  sellItemsByQuality: async (quality: string) => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'sellItemsByQuality',
        warn: false,
      })
      if (!selectedId) return { count: 0, total_price: 0 }
      const response = (await post('/rpg/inventory/sell-by-quality', {
        quality,
        character_id: selectedId,
      })) as { count: number; total_price: number; copper: number }
      soundManager.play('gold')
      set(state => ({
        ...state,
        character: withUpdatedCopper(state.character, response.copper),
        inventory: state.inventory.filter(i =>
          quality === 'all'
            ? i.definition?.type === 'gem'
            : i.quality !== quality || i.definition?.type === 'gem'
        ),
        isLoading: false,
      }))
      return { count: response.count, total_price: response.total_price }
    } catch (error) {
      setRequestError(set, error)
      return { count: 0, total_price: 0 }
    }
  },

  updateAutoRecycleSettings: async (maxValue: number | null) => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'updateAutoRecycleSettings',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/inventory/auto-recycle-settings', {
        character_id: selectedId,
        auto_recycle_max_value: maxValue ?? 0,
      })) as {
        character: GameCharacter
        recycled: { count: number; total_price: number; copper: number }
      }
      set(state => ({
        ...state,
        character: state.character
          ? { ...state.character, ...response.character, copper: response.recycled.copper }
          : response.character,
        isLoading: false,
      }))
      if (response.recycled.count > 0) {
        soundManager.play('gold')
        await get().fetchInventory()
      }
    } catch (error) {
      setRequestError(set, error)
    }
  },

  moveItem: async (itemId, toStorage, slotIndex) => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'moveItem',
        warn: false,
      })
      if (!selectedId) return
      await post('/rpg/inventory/move', {
        item_id: itemId,
        to_storage: toStorage,
        slot_index: slotIndex,
        character_id: selectedId,
      })
      // 重新获取背包
      get().fetchInventory()
    } catch (error) {
      setRequestError(set, error)
    }
  },

  sortInventory: async (sortBy, inStorage = false) => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'sortInventory',
        warn: false,
      })
      if (!selectedId) return
      await post('/rpg/inventory/sort', {
        sort_by: sortBy,
        to_storage: inStorage,
        character_id: selectedId,
      })
      // 重新获取背包
      get().fetchInventory()
    } catch (error) {
      setRequestError(set, error)
    }
  },

  fetchSkills: async () => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, { context: 'fetchSkills' })
      if (!selectedId) return
      const params = `?character_id=${selectedId}`
      const response = (await apiGet(`/rpg/skills${params}`)) as {
        skills: SkillWithLearnedState[]
        skill_points: number
      }
      const skills = response.skills ?? []

      const enabledSkillIds = resolveEnabledSkillIds(skills, get().enabledSkillIds)

      set(state => ({
        ...state,
        skills,
        character: patchCharacter(state.character, { skill_points: response.skill_points }),
        enabledSkillIds,
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  learnSkill: async skillId => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'learnSkill',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/skills/learn', {
        skill_id: skillId,
        character_id: selectedId,
      })) as { character_skill?: CharacterSkill; skill_points: number }
      const cs = response.character_skill
      set(state => {
        if (!cs) {
          return {
            ...state,
            character: patchCharacter(state.character, { skill_points: response.skill_points }),
            isLoading: false,
          }
        }
        const learnedSkill = state.skills.find(s => s.id === cs.skill_id)
        const nextSkills = state.skills.map(s => {
          if (s.id === cs.skill_id) {
            return {
              ...s,
              is_learned: true,
              character_skill_id: cs.id,
              level: cs.level ?? 1,
              slot_index: cs.slot_index ?? null,
            }
          }
          if (
            learnedSkill?.node_tier === 2 &&
            learnedSkill.skill_line &&
            s.skill_line === learnedSkill.skill_line &&
            s.node_tier === 2
          ) {
            return {
              ...s,
              is_learned: false,
              character_skill_id: undefined,
              level: undefined,
              slot_index: undefined,
            }
          }
          return s
        })
        const isNewBaseActiveSkill =
          learnedSkill &&
          learnedSkill.type === 'active' &&
          (learnedSkill.node_tier === 0 ||
            learnedSkill.node_tier === undefined ||
            learnedSkill.node_tier === null)
        const clearedSiblingIds =
          learnedSkill?.node_tier === 2 && learnedSkill.skill_line
            ? state.skills
                .filter(
                  s =>
                    s.skill_line === learnedSkill.skill_line &&
                    s.node_tier === 2 &&
                    s.id !== cs.skill_id
                )
                .map(s => s.id)
            : []
        const newEnabledSkillIds = isNewBaseActiveSkill
          ? [...state.enabledSkillIds.filter(id => !clearedSiblingIds.includes(id)), cs.skill_id]
          : state.enabledSkillIds.filter(id => !clearedSiblingIds.includes(id))
        return {
          ...state,
          skills: nextSkills,
          character: patchCharacter(state.character, { skill_points: response.skill_points }),
          enabledSkillIds: newEnabledSkillIds,
          isLoading: false,
        }
      })
      if (!cs) {
        get().fetchSkills()
      }
    } catch (error) {
      setRequestError(set, error)
    }
  },

  fetchMaps: async () => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, { context: 'fetchMaps' })
      if (!selectedId) return
      const params = `?character_id=${selectedId}`
      const response = (await apiGet(`/rpg/maps${params}`)) as {
        maps: MapDefinition[]
        progress: Record<number, CharacterMap>
        current_map_id: number | null
      }
      const currentMap = response.current_map_id
        ? (response.maps.find(m => m.id === response.current_map_id) ?? null)
        : null
      set(state => ({
        ...state,
        maps: response.maps ?? [],
        currentMap,
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  enterMap: async mapId => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'enterMap',
        warn: false,
      })
      if (!selectedId) return
      const response = await post<EnterMapResponse>('/rpg/maps/' + mapId + '/enter', {
        character_id: selectedId,
      })
      soundManager.play('teleport') // 使用传送音效
      const maps = get().maps
      const currentMap = response.map ?? maps.find(m => m.id === mapId) ?? null
      const char = response.character
      set(state => ({
        ...state,
        maps:
          currentMap && !state.maps.some(map => map.id === currentMap.id)
            ? [...state.maps, currentMap]
            : state.maps,
        currentMap,
        character: char,
        isFighting: false,
        shouldAutoCombat: true,
        isLoading: false,
        combatResult: null,
        statusCombatMonsters: response.monsters ?? null,
        // 切图返回的可能是「切图瞬间已死亡」的角色数据，必须同步 HP/MP，
        // 否则界面会一直显示切图前的旧血量，卡在战斗画面(实际已死亡)
        currentHp: char?.current_hp ?? state.currentHp,
        currentMana: char?.current_mana ?? state.currentMana,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  teleportToMap: async mapId => {
    startRequest(set)
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'teleportToMap',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/maps/' + mapId + '/teleport', {
        character_id: selectedId,
      })) as EnterMapResponse
      soundManager.play('skill_use')
      const maps = get().maps
      const currentMap = response.map ?? maps.find(m => m.id === mapId) ?? null
      const char = response.character
      set(state => ({
        ...state,
        maps:
          currentMap && !state.maps.some(map => map.id === currentMap.id)
            ? [...state.maps, currentMap]
            : state.maps,
        currentMap,
        character: char,
        isFighting: false,
        shouldAutoCombat: true,
        isLoading: false,
        enabledSkillIds: resolveEnabledSkillIds(state.skills, state.enabledSkillIds),
        combatResult: null,
        statusCombatMonsters: response.monsters ?? null,
        // 复活时后端只恢复基础生命/法力，用返回的 character 更新当前 HP/MP 显示
        currentHp: char?.current_hp ?? state.currentHp,
        currentMana: char?.current_mana ?? state.currentMana,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  fetchCombatStatus: async () => {
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'fetchCombatStatus',
        stopLoading: false,
      })
      if (!selectedId) return
      const params = `?character_id=${selectedId}`
      const response = (await apiGet(`/rpg/combat/status${params}`)) as {
        is_fighting: boolean
        current_map: MapDefinition | null
        combat_stats: CombatStats
        current_hp: number
        current_mana: number
        last_combat_at: string | null
        current_combat_monster?: {
          id: number
          name: string
          type: string
          level: number
          icon?: string | null
          hp: number
          max_hp: number
        }
        current_combat_monsters?: (CombatMonster | null)[]
      }
      set(state => ({
        ...state,
        isFighting: response.is_fighting,
        currentMap: response.current_map,
        combatStats: response.combat_stats,
        currentHp: response.current_hp,
        currentMana: response.current_mana,
        statusCombatMonsters: response.is_fighting
          ? (response.current_combat_monsters ?? null)
          : null,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch combat status error:', error)
    }
  },

  fetchCombatLogs: async () => {
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'fetchCombatLogs',
        stopLoading: false,
      })
      if (!selectedId) return
      const params = `?character_id=${selectedId}`
      const response = (await apiGet(`/rpg/combat/logs${params}`)) as {
        logs: CombatLog[]
      }
      set(state => ({
        ...state,
        combatLogs: response.logs || [],
      }))
    } catch (error) {
      console.error('[GameStore] Fetch combat logs error:', error)
    }
  },

  // 获取单条战斗日志详情
  fetchCombatLogDetail: async (logId: number) => {
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'fetchCombatLogDetail',
        stopLoading: false,
        warn: false,
      })
      if (!selectedId) return
      const params = `?character_id=${selectedId}`
      const response = (await apiGet(`/rpg/combat/logs/${logId}${params}`)) as {
        log: CombatLogDetail
      }
      set(state => ({
        ...state,
        combatLogDetail: response.log || null,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch combat log detail error:', error)
    }
  },

  // 清除战斗日志详情
  clearCombatLogDetail: () => {
    set(state => ({
      ...state,
      combatLogDetail: null,
    }))
  },

  startCombat: async () => {
    if (startCombatInFlight) return

    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'startCombat',
        warn: true,
      })
      const enabledIds = get().enabledSkillIds
      if (!selectedId) return

      startCombatInFlight = true
      startRequest(set, {
        combatResult: null,
        ...withCombatFlag(get(), true),
      })
      const body: { character_id: number; skill_ids?: number[] } = { character_id: selectedId }
      if (enabledIds.length > 0) body.skill_ids = enabledIds
      reportCombatDebug('gameStore.ts:startCombat:before', 'calling combat/start', {
        characterId: selectedId,
        skillIds: body.skill_ids,
      })
      await post<{ message?: string }>('/rpg/combat/start', body)
      reportCombatDebug('gameStore.ts:startCombat:after', 'combat/start success', {
        characterId: selectedId,
      })
      soundManager.play('combat_start')
      set(state => ({
        ...state,
        ...withCombatFlag(state, true),
        isLoading: false,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('自动战斗已在运行中') || message.includes('自动战斗已在进行中')) {
        await get().fetchCombatStatus()
        await get().fetchCombatLogs()
        set(state => ({
          ...state,
          ...withCombatFlag(state, true),
          error: null,
          isLoading: false,
        }))
        return
      }

      set(state => ({
        ...state,
        ...withCombatFlag(state, false),
        error: message,
        isLoading: false,
      }))
    } finally {
      startCombatInFlight = false
    }
  },

  /** 复活角色，不自动开始战斗 */
  revive: async () => {
    // 立即清空战斗结果和战斗状态，避免界面继续显示死亡前的怪物
    startRequest(set, {
      combatResult: null,
      statusCombatMonsters: null,
      isFighting: false,
      shouldAutoCombat: false,
    })
    try {
      const selectedId = getSelectedCharacterIdOrAbort(get, set, {
        context: 'revive',
        warn: false,
      })
      if (!selectedId) return
      const response = (await post('/rpg/combat/revive', { character_id: selectedId })) as {
        character?: GameCharacter
      }
      const char = response.character
      await get().fetchCombatStatus()
      // 刷新角色数据
      await get().fetchCharacter()
      // 复活后不自动开始战斗，并清空上次战斗结果，避免继续显示怪物头像/HP
      set(state => ({
        ...state,
        ...withCombatFlag(state, false),
        shouldAutoCombat: false,
        combatResult: null,
        statusCombatMonsters: null,
        character: char ?? state.character,
        currentHp: char?.current_hp ?? state.currentHp,
        currentMana: char?.current_mana ?? state.currentMana,
        enabledSkillIds: resolveEnabledSkillIds(state.skills, state.enabledSkillIds),
        isLoading: false,
      }))
    } catch (error) {
      setRequestError(set, error)
    }
  },

  stopCombat: async () => {
    try {
      const selectedId = get().selectedCharacterId
      if (selectedId) {
        await post('/rpg/combat/stop', { character_id: selectedId })
      }
    } finally {
      get().flushPendingCombatLog()
      set(state => ({
        ...state,
        enabledSkillIds: [],
        ...withCombatFlag(state, false),
        shouldAutoCombat: false,
        combatResult: null,
        statusCombatMonsters: null,
        pendingCombatLog: null,
      }))
    }
  },

  setShouldAutoCombat: (should: boolean) => {
    set(state =>
      state.shouldAutoCombat === should ? state : { ...state, shouldAutoCombat: should }
    )
  },

  toggleEnabledSkill: async (skillId: number) => {
    const wasFighting = get().isFighting
    const shouldSyncCombatSkills = wasFighting || get().shouldAutoCombat
    set(state => {
      const ids = state.enabledSkillIds
      const has = ids.includes(skillId)
      return {
        ...state,
        enabledSkillIds: has ? ids.filter(id => id !== skillId) : [...ids, skillId],
      }
    })
    // 自动战斗流程进行中（包括启动中的瞬间）时，同步更新后端技能配置
    if (shouldSyncCombatSkills) {
      const selectedId = get().selectedCharacterId
      const enabledIds = get().enabledSkillIds
      if (selectedId) {
        try {
          // 传 skill_id 参数让后端识别是单个技能操作
          await post('/rpg/combat/skills', {
            character_id: selectedId,
            skill_id: skillId,
            skill_ids: enabledIds,
          })
        } catch (error) {
          console.error('[GameStore] Failed to update combat skills:', error)
        }
      }
    }
  },

  // WebSocket 事件处理
  // 处理怪物出现事件
  handleMonstersAppear: data => {
    const typedData = data as GameMonstersAppearEvent
    if (!get().isFighting) return

    const currentHp = typedData.character?.current_hp ?? get().currentHp
    const currentMana = typedData.character?.current_mana ?? get().currentMana

    set(state => ({
      ...state,
      statusCombatMonsters: typedData.monsters || [],
      // 战斗回合数据优先：刷新推送不应冲掉当前回合的扣血/死亡表现
      ...(state.combatResult == null ? { combatResult: null } : {}),
      currentHp,
      currentMana,
    }))
  },

  handleCombatUpdate: data => {
    const typedData = data as GameCombatUpdateEvent
    const isTerminal = Boolean(typedData.defeat || typedData.auto_stopped)

    // 复活或停止战斗后可能仍会收到延迟的战斗推送，不再更新 combatResult，避免继续显示怪物。
    // 但死亡/自动停止这类终止事件，若因竞态(看门狗 stopCombat、status 同步等)在事件到达前
    // 就把 isFighting 置为 false，仍必须应用，否则会出现「界面数据没变，但角色已死亡」。
    // 复活后 combatResult 已被清空且 HP>0，此时才忽略过期的终止事件。
    if (!get().isFighting) {
      const alreadyRevived = get().combatResult == null && (get().currentHp ?? 0) > 0
      if (!isTerminal || alreadyRevived) return
    }

    if (isTerminal) {
      soundManager.play('combat_defeat')
    }

    set(state => {
      // 优先使用顶层字段，其次使用 character 对象中的字段
      // 只有当值存在时才更新（避免用 null 覆盖正确的值）
      const newCurrentHp =
        typedData.current_hp ?? typedData.character?.current_hp ?? state.currentHp
      const newCurrentMana =
        typedData.current_mana ?? typedData.character?.current_mana ?? state.currentMana

      const dataLogId = extractCombatLogId(typedData)
      const pendingCombatLog =
        dataLogId != null ? ({ ...typedData, id: dataLogId } as CombatLogEntry) : null

      return {
        combatResult: typedData,
        pendingCombatLog: pendingCombatLog ?? state.pendingCombatLog,
        character: typedData.character,
        // 只有当新值存在且不为 undefined 时才更新
        ...(newCurrentHp !== undefined && { currentHp: newCurrentHp }),
        ...(newCurrentMana !== undefined && { currentMana: newCurrentMana }),
        inventory: typedData.loot?.item
          ? [...state.inventory, typedData.loot.item as GameItem]
          : state.inventory,
        // 战败时自动停止战斗（保留技能启用状态，复活后无需重新勾选）
        ...(typedData.auto_stopped && {
          isFighting: false,
          shouldAutoCombat: false,
        }),
      }
    })

    if (typedData.auto_stopped || typedData.defeat) {
      setTimeout(() => {
        get().flushPendingCombatLog()
      }, 1800)
    }

    // 背包由 WebSocket inventory.update 推送，不再在此处请求 fetchInventory
  },

  flushPendingCombatLog: () => {
    set(state => {
      if (!state.pendingCombatLog) return state

      return {
        ...state,
        combatLogs: mergeCombatLogsWithUpdate(
          state.combatLogs,
          state.pendingCombatLog as GameCombatUpdateEvent
        ),
        pendingCombatLog: null,
      }
    })
  },

  handleInventoryUpdate: data => {
    set(state => ({
      ...state,
      inventory: data.inventory ?? state.inventory,
      storage: data.storage ?? state.storage,
      equipment: data.equipment ?? state.equipment,
      inventorySize:
        typeof data.inventory_size === 'number' ? data.inventory_size : state.inventorySize,
      storageSize: typeof data.storage_size === 'number' ? data.storage_size : state.storageSize,
    }))
  },

  handleLootDropped: data => {
    const typedData = data as GameLootDroppedEvent
    soundManager.play('item_drop')
    set(state => ({
      inventory: typedData.item
        ? [...state.inventory, typedData.item as GameItem]
        : state.inventory,
      character: state.character
        ? {
            ...state.character,
            copper: (state.character.copper || 0) + (typedData.copper || 0),
            current_hp: typedData.character?.current_hp ?? state.character.current_hp,
            current_mana: typedData.character?.current_mana ?? state.character.current_mana,
          }
        : null,
    }))
  },

  handleLevelUp: data => {
    const typedData = data as GameLevelUpEvent
    soundManager.play('level_up')
    set(state => ({
      ...state,
      character: typedData.character,
      currentHp: typedData.character?.current_hp ?? state.currentHp,
      currentMana: typedData.character?.current_mana ?? state.currentMana,
    }))
  },

  clearError: () => set(state => ({ ...state, error: null })),

  reset: () => set(initialState),

  // 图鉴操作
  fetchCompendiumItems: async () => {
    const selectedId = get().selectedCharacterId
    if (!selectedId) return

    startRequest(set)
    try {
      const response = (await apiGet(`/rpg/compendium/items?character_id=${selectedId}`)) as {
        items: CompendiumItem[]
        total: number
        discovered_count: number
      }
      set(state => ({
        ...state,
        compendiumItems: response.items || [],
        isLoading: false,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch compendium items error:', error)
      setRequestError(set, error)
    }
  },

  fetchCompendiumMonsters: async () => {
    const selectedId = get().selectedCharacterId
    if (!selectedId) return

    startRequest(set)
    try {
      const response = (await apiGet(`/rpg/compendium/monsters?character_id=${selectedId}`)) as {
        monsters: CompendiumMonster[]
        total: number
        discovered_count: number
      }
      set(state => ({
        ...state,
        compendiumMonsters: response.monsters || [],
        isLoading: false,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch compendium monsters error:', error)
      setRequestError(set, error)
    }
  },

  fetchCompendiumMonsterDrops: async (monsterId: number) => {
    try {
      const response = (await apiGet(
        `/rpg/compendium/monsters/${monsterId}/drops`
      )) as CompendiumMonsterDrops
      set(state => ({
        ...state,
        compendiumMonsterDrops: response,
      }))
    } catch (error) {
      console.error('[GameStore] Fetch compendium monster drops error:', error)
      set(state => ({ ...state, error: (error as Error).message }))
    }
  },

  clearCompendiumMonsterDrops: () => {
    set(state => ({ ...state, compendiumMonsterDrops: null }))
  },
})

export const useGameStore = create<GameState>()(
  persist(store, {
    name: 'rpg-game-storage',
    // 只持久化必要的 UI 状态，不持久化频繁变化的游戏数据
    partialize: state => ({
      selectedCharacterId: state.selectedCharacterId,
      activeTab: state.activeTab,
      compareEquippedCollapsed: state.compareEquippedCollapsed,
    }),
    merge: (persistedState, currentState) => {
      const merged = {
        ...currentState,
        ...(persistedState as Partial<GameState>),
      }
      if ((merged.activeTab as string) === 'shop') {
        merged.activeTab = 'character'
      }
      return merged
    },
    skipHydration: true, // 跳过自动 hydration，手动控制
  })
)

// 手动触发 hydration
if (typeof window !== 'undefined') {
  useGameStore.persist.rehydrate()
}
