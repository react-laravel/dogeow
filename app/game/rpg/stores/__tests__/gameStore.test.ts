import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameStore } from '../gameStore'
import type { GameCharacter, GameItem, MapDefinition, SkillWithLearnedState } from '../../types'

// Mock dependencies
vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiRequest: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}))

vi.mock('../utils/soundManager', () => ({
  soundManager: {
    play: vi.fn(),
  },
}))

vi.mock('./combatHelpers', () => ({
  reportCombatDebug: vi.fn(),
  extractCombatLogId: vi.fn(() => null),
  mergeCombatLogsWithUpdate: vi.fn(logs => logs),
}))

vi.mock('./gameStateHelpers', () => ({
  normalizeEquipmentResponse: vi.fn(equip => equip),
  getSelectedCharacterIdOrAbort: vi.fn(() => 1),
  setRequestError: vi.fn(),
  startRequest: vi.fn(),
  patchCharacter: vi.fn((char, patch) => ({ ...char, ...patch })),
  withUpdatedCopper: vi.fn((char, copper) => ({ ...char, copper })),
  withCombatFlag: vi.fn((state, flag) => ({ ...state, isFighting: flag })),
}))

describe('GameStore', () => {
  beforeEach(() => {
    useGameStore.setState({
      characters: [],
      character: null,
      selectedCharacterId: null,
      experienceTable: {},
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
      maps: [],
      currentMap: null,
      isFighting: false,
      shouldAutoCombat: false,
      enabledSkillIds: [],
      combatResult: null,
      statusCombatMonsters: null,
      combatLogs: [],
      pendingCombatLog: null,
      combatLogDetail: null,
      isLoading: false,
      error: null,
      activeTab: 'character',
      compareEquippedCollapsed: false,
      compendiumItems: [],
      compendiumMonsters: [],
      compendiumMonsterDrops: null,
    })
  })

  describe('setActiveTab', () => {
    it('should set the active tab', () => {
      useGameStore.getState().setActiveTab('inventory')
      expect(useGameStore.getState().activeTab).toBe('inventory')
    })

    it('should set activeTab to combat', () => {
      useGameStore.getState().setActiveTab('combat')
      expect(useGameStore.getState().activeTab).toBe('combat')
    })
  })

  describe('fetchCharacters', () => {
    it('should fetch characters successfully', async () => {
      const mockCharacters = [{ id: 1, name: 'Test Character', class: 'warrior', level: 1 }]
      const { apiGet } = await import('@/lib/api')
      vi.mocked(apiGet).mockResolvedValueOnce({ characters: mockCharacters })

      await useGameStore.getState().fetchCharacters()

      expect(apiGet).toHaveBeenCalledWith('/rpg/characters')
      expect(useGameStore.getState().characters).toEqual(mockCharacters)
    })

    it('should handle fetch characters error', async () => {
      const { apiGet } = await import('@/lib/api')
      vi.mocked(apiGet).mockRejectedValueOnce(new Error('Network error'))

      await useGameStore.getState().fetchCharacters()

      expect(useGameStore.getState().error).toBe('Network error')
      expect(useGameStore.getState().characters).toEqual([])
    })
  })

  describe('selectCharacter', () => {
    it('should select a character and fetch its data', async () => {
      const { post, apiGet } = await import('@/lib/api')
      vi.mocked(post).mockResolvedValueOnce({})
      vi.mocked(apiGet).mockResolvedValueOnce({
        character: { id: 1, name: 'Test', class: 'warrior', level: 1 },
      })

      await useGameStore.getState().selectCharacter(1)

      expect(post).toHaveBeenCalledWith('/rpg/character/online', { character_id: 1 })
    })
  })

  describe('createCharacter', () => {
    it('should create a new character', async () => {
      const { post } = await import('@/lib/api')
      const newCharacter = {
        id: 1,
        name: 'NewChar',
        class: 'warrior',
        level: 1,
        combat_stats: {
          max_hp: 100,
          max_mana: 50,
          attack: 10,
          defense: 5,
          crit_rate: 0.1,
          crit_damage: 1.5,
        },
      }
      vi.mocked(post).mockResolvedValueOnce({
        character: newCharacter,
        combat_stats: newCharacter.combat_stats,
      })

      await useGameStore.getState().createCharacter('NewChar', 'warrior')

      expect(useGameStore.getState().characters).toContainEqual(newCharacter)
    })
  })

  describe('deleteCharacter', () => {
    it('should delete a character', async () => {
      useGameStore.setState({
        characters: [{ id: 1, name: 'ToDelete' } as GameCharacter],
        selectedCharacterId: 1,
      })

      const { del } = await import('@/lib/api')
      vi.mocked(del).mockResolvedValueOnce({})

      await useGameStore.getState().deleteCharacter(1)

      expect(useGameStore.getState().characters).toHaveLength(0)
      expect(useGameStore.getState().selectedCharacterId).toBeNull()
    })
  })

  describe('fetchInventory', () => {
    it('should fetch inventory successfully', async () => {
      const { apiGet } = await import('@/lib/api')
      vi.mocked(apiGet).mockResolvedValueOnce({
        inventory: [{ id: 1, name: 'Item1' }],
        storage: [],
        equipment: {},
        inventory_size: 50,
        storage_size: 50,
      })

      useGameStore.setState({ selectedCharacterId: 1 })
      await useGameStore.getState().fetchInventory()

      expect(apiGet).toHaveBeenCalled()
      expect(useGameStore.getState().inventory).toHaveLength(1)
    })
  })

  describe('equipItem', () => {
    it('should equip an item', async () => {
      const { post } = await import('@/lib/api')
      vi.mocked(post).mockResolvedValueOnce({
        equipped_item: { id: 2, name: 'Equipped' },
        equipped_slot: 'weapon',
        unequipped_item: null,
        combat_stats: {
          max_hp: 100,
          max_mana: 50,
          attack: 15,
          defense: 5,
          crit_rate: 0.1,
          crit_damage: 1.5,
        },
      })

      useGameStore.setState({
        selectedCharacterId: 1,
        inventory: [{ id: 2, name: 'Sword' } as unknown as GameItem],
      })

      await useGameStore.getState().equipItem(2)

      expect(useGameStore.getState().inventory).toHaveLength(0)
      expect(useGameStore.getState().equipment.weapon).toBeDefined()
    })
  })

  describe('unequipItem', () => {
    it('should unequip an item to inventory', async () => {
      const { post } = await import('@/lib/api')
      vi.mocked(post).mockResolvedValueOnce({
        item: { id: 2, name: 'Sword' },
        combat_stats: {
          max_hp: 100,
          max_mana: 50,
          attack: 10,
          defense: 5,
          crit_rate: 0.1,
          crit_damage: 1.5,
        },
      })

      useGameStore.setState({
        selectedCharacterId: 1,
        equipment: { weapon: { id: 2, name: 'Sword' } as unknown as GameItem },
      })

      await useGameStore.getState().unequipItem('weapon')

      expect(useGameStore.getState().inventory).toHaveLength(1)
      expect(useGameStore.getState().equipment.weapon).toBeNull()
    })
  })

  describe('sellItem', () => {
    it('should sell an item', async () => {
      const { post } = await import('@/lib/api')
      vi.mocked(post).mockResolvedValueOnce({ copper: 1000, sell_price: 100 })

      useGameStore.setState({
        selectedCharacterId: 1,
        inventory: [{ id: 2, name: 'Item' } as unknown as GameItem],
        character: { id: 1, copper: 0 } as GameCharacter,
      })

      await useGameStore.getState().sellItem(2, 1)

      expect(useGameStore.getState().inventory).toHaveLength(0)
    })
  })

  describe('fetchSkills', () => {
    it('should fetch skills successfully', async () => {
      const { apiGet } = await import('@/lib/api')
      vi.mocked(apiGet).mockResolvedValueOnce({
        skills: [{ id: 1, name: 'Skill1', is_learned: true, type: 'active' }],
        skill_points: 5,
      })

      useGameStore.setState({ selectedCharacterId: 1 })
      await useGameStore.getState().fetchSkills()

      expect(useGameStore.getState().skills).toHaveLength(1)
      expect(useGameStore.getState().skills[0].is_learned).toBe(true)
    })
  })

  describe('learnSkill', () => {
    it('should learn a skill', async () => {
      const { post } = await import('@/lib/api')
      vi.mocked(post).mockResolvedValueOnce({
        character_skill: { id: 1, skill_id: 1, level: 1 },
        skill_points: 3,
      })

      useGameStore.setState({
        selectedCharacterId: 1,
        skills: [
          { id: 1, name: 'NewSkill', is_learned: false, type: 'active' } as SkillWithLearnedState,
        ],
      })

      await useGameStore.getState().learnSkill(1)

      const skill = useGameStore.getState().skills.find(s => s.id === 1)
      expect(skill?.is_learned).toBe(true)
    })
  })

  describe('fetchMaps', () => {
    it('should fetch maps successfully', async () => {
      const { apiGet } = await import('@/lib/api')
      vi.mocked(apiGet).mockResolvedValueOnce({
        maps: [{ id: 1, name: 'Map1' }],
        progress: {},
        current_map_id: null,
      })

      useGameStore.setState({ selectedCharacterId: 1 })
      await useGameStore.getState().fetchMaps()

      expect(useGameStore.getState().maps).toHaveLength(1)
    })
  })

  describe('enterMap', () => {
    it('should enter a map and request auto combat', async () => {
      const { post } = await import('@/lib/api')
      vi.mocked(post).mockResolvedValueOnce({
        character: { id: 1, name: 'Test', is_fighting: true },
        map: { id: 1, name: 'Map1' },
        monsters: [{ id: 10, name: 'Goblin', type: 'normal', level: 1, hp: 20, max_hp: 20 }],
      })

      useGameStore.setState({
        selectedCharacterId: 1,
        maps: [{ id: 1, name: 'Map1', act: 1, monster_ids: [] } as MapDefinition],
        combatResult: { victory: false } as any,
        statusCombatMonsters: [
          { id: 1, name: 'Deer', type: 'normal', level: 1, hp: 20, max_hp: 20 },
        ],
      })

      await useGameStore.getState().enterMap(1)

      expect(useGameStore.getState().isFighting).toBe(false)
      expect(useGameStore.getState().shouldAutoCombat).toBe(true)
      expect(useGameStore.getState().combatResult).toBeNull()
      expect(useGameStore.getState().statusCombatMonsters?.[0]?.name).toBe('Goblin')
    })
  })

  describe('fetchCombatStatus', () => {
    it('should fetch combat status', async () => {
      const { apiGet } = await import('@/lib/api')
      vi.mocked(apiGet).mockResolvedValueOnce({
        is_fighting: true,
        current_map: { id: 1, name: 'Map1' },
        combat_stats: {
          max_hp: 100,
          max_mana: 50,
          attack: 10,
          defense: 5,
          crit_rate: 0.1,
          crit_damage: 1.5,
        },
        current_hp: 80,
        current_mana: 40,
        last_combat_at: null,
        current_combat_monster: {
          id: 1,
          name: 'Monster',
          type: 'normal',
          level: 1,
          hp: 50,
          max_hp: 50,
        },
      })

      useGameStore.setState({ selectedCharacterId: 1 })
      await useGameStore.getState().fetchCombatStatus()

      expect(useGameStore.getState().isFighting).toBe(true)
      expect(useGameStore.getState().currentHp).toBe(80)
    })
  })

  describe('startCombat', () => {
    it('should start combat', async () => {
      const { post } = await import('@/lib/api')
      vi.mocked(post).mockResolvedValueOnce({})

      useGameStore.setState({
        selectedCharacterId: 1,
        isFighting: false,
        shouldAutoCombat: false,
      })

      await useGameStore.getState().startCombat()

      expect(useGameStore.getState().isFighting).toBe(true)
    })

    it('should handle combat already running error', async () => {
      const { post } = await import('@/lib/api')
      vi.mocked(post).mockRejectedValueOnce(new Error('自动战斗已在运行中'))

      useGameStore.setState({ selectedCharacterId: 1 })

      await useGameStore.getState().startCombat()

      expect(useGameStore.getState().error).toBeNull()
    })
  })

  describe('stopCombat', () => {
    it('should stop combat', async () => {
      const { post } = await import('@/lib/api')
      vi.mocked(post).mockResolvedValueOnce({})

      useGameStore.setState({
        selectedCharacterId: 1,
        isFighting: true,
        shouldAutoCombat: true,
        enabledSkillIds: [1, 2],
      })

      await useGameStore.getState().stopCombat()

      expect(useGameStore.getState().isFighting).toBe(false)
      expect(useGameStore.getState().shouldAutoCombat).toBe(false)
      expect(useGameStore.getState().enabledSkillIds).toHaveLength(0)
    })
  })

  describe('setShouldAutoCombat', () => {
    it('should set auto combat flag', () => {
      useGameStore.getState().setShouldAutoCombat(true)
      expect(useGameStore.getState().shouldAutoCombat).toBe(true)

      useGameStore.getState().setShouldAutoCombat(false)
      expect(useGameStore.getState().shouldAutoCombat).toBe(false)
    })
  })

  describe('toggleEnabledSkill', () => {
    it('should toggle skill on', () => {
      useGameStore.setState({ enabledSkillIds: [] })
      useGameStore.getState().toggleEnabledSkill(1)
      expect(useGameStore.getState().enabledSkillIds).toContain(1)
    })

    it('should toggle skill off', () => {
      useGameStore.setState({ enabledSkillIds: [1, 2] })
      useGameStore.getState().toggleEnabledSkill(1)
      expect(useGameStore.getState().enabledSkillIds).not.toContain(1)
    })
  })

  describe('handleMonstersAppear', () => {
    it('should handle monsters appear event', () => {
      useGameStore.setState({
        isFighting: true,
        combatResult: { victory: false } as never,
      })

      useGameStore.getState().handleMonstersAppear({
        monsters: [{ id: 1, name: 'Monster1', type: 'normal', level: 1, hp: 50, max_hp: 50 }],
        character: { current_hp: 100, current_mana: 50 },
      })

      expect(useGameStore.getState().statusCombatMonsters).toHaveLength(1)
      expect(useGameStore.getState().combatResult).toBeDefined()
    })

    it('should clear combat result when monsters appear before any round data', () => {
      useGameStore.setState({
        isFighting: true,
        combatResult: null,
      })

      useGameStore.getState().handleMonstersAppear({
        monsters: [{ id: 1, name: 'Monster1', type: 'normal', level: 1, hp: 50, max_hp: 50 }],
        character: { current_hp: 100, current_mana: 50 },
      })

      expect(useGameStore.getState().statusCombatMonsters).toHaveLength(1)
      expect(useGameStore.getState().combatResult).toBeNull()
    })

    it('should not update if not fighting', () => {
      useGameStore.setState({ isFighting: false })

      useGameStore.getState().handleMonstersAppear({
        monsters: [],
        character: { current_hp: 100, current_mana: 50 },
      })

      expect(useGameStore.getState().statusCombatMonsters).toBeNull()
    })
  })

  describe('handleCombatUpdate', () => {
    it('should handle combat update event', () => {
      useGameStore.setState({ isFighting: true })

      useGameStore.getState().handleCombatUpdate({
        victory: false,
        combat_log_id: 99,
        monster: { name: 'Monster', type: 'normal', level: 1 },
        damage_dealt: 10,
        damage_taken: 5,
        rounds: 1,
        experience_gained: 100,
        copper_gained: 50,
        loot: {},
        character: { id: 1, name: 'Test' },
      })

      expect(useGameStore.getState().combatResult).toBeDefined()
      expect(useGameStore.getState().pendingCombatLog).not.toBeNull()
      expect(useGameStore.getState().combatLogs).toHaveLength(0)

      useGameStore.getState().flushPendingCombatLog()

      expect(useGameStore.getState().combatLogs).toHaveLength(1)
      expect(useGameStore.getState().pendingCombatLog).toBeNull()
    })

    it('should preserve enabled skills when auto stopped after defeat', () => {
      useGameStore.setState({ isFighting: true, enabledSkillIds: [1, 2, 3] })

      useGameStore.getState().handleCombatUpdate({
        auto_stopped: true,
        defeat: true,
        character: { id: 1, name: 'Test' },
      })

      expect(useGameStore.getState().isFighting).toBe(false)
      expect(useGameStore.getState().enabledSkillIds).toEqual([1, 2, 3])
    })
  })

  describe('handleInventoryUpdate', () => {
    it('should update inventory from websocket', () => {
      useGameStore.getState().handleInventoryUpdate({
        inventory: [{ id: 1, name: 'NewItem' } as unknown as GameItem],
      })

      expect(useGameStore.getState().inventory).toHaveLength(1)
    })
  })

  describe('handleLootDropped', () => {
    it('should handle loot dropped event', () => {
      useGameStore.setState({
        inventory: [],
        character: { id: 1, copper: 100 } as GameCharacter,
      })

      useGameStore.getState().handleLootDropped({
        item: { id: 1, name: 'DroppedItem' } as unknown as GameItem,
        copper: 50,
      })

      expect(useGameStore.getState().inventory).toHaveLength(1)
    })
  })

  describe('handleLevelUp', () => {
    it('should handle level up event', () => {
      useGameStore.setState({
        character: { id: 1, level: 1, current_hp: 100, current_mana: 50 } as GameCharacter,
        currentHp: 100,
        currentMana: 50,
      })

      useGameStore.getState().handleLevelUp({
        character: { id: 1, level: 2, current_hp: 120, current_mana: 60 } as GameCharacter,
      })

      expect(useGameStore.getState().character?.level).toBe(2)
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      useGameStore.setState({ error: 'Some error' })
      useGameStore.getState().clearError()
      expect(useGameStore.getState().error).toBeNull()
    })
  })

  describe('reset', () => {
    it('should reset store to initial state', () => {
      useGameStore.setState({
        characters: [{ id: 1 } as GameCharacter],
        error: 'error',
        isLoading: true,
      })

      useGameStore.getState().reset()

      expect(useGameStore.getState().characters).toEqual([])
      expect(useGameStore.getState().error).toBeNull()
    })
  })

  describe('fetchCompendiumItems', () => {
    it('should fetch compendium items', async () => {
      const { apiGet } = await import('@/lib/api')
      vi.mocked(apiGet).mockResolvedValueOnce({
        items: [{ id: 1, name: 'Item1' }],
        total: 10,
        discovered_count: 5,
      })

      useGameStore.setState({ selectedCharacterId: 1 })
      await useGameStore.getState().fetchCompendiumItems()

      expect(useGameStore.getState().compendiumItems).toHaveLength(1)
    })
  })

  describe('fetchCompendiumMonsters', () => {
    it('should fetch compendium monsters', async () => {
      const { apiGet } = await import('@/lib/api')
      vi.mocked(apiGet).mockResolvedValueOnce({
        monsters: [{ id: 1, name: 'Monster1' }],
        total: 5,
        discovered_count: 2,
      })

      useGameStore.setState({ selectedCharacterId: 1 })
      await useGameStore.getState().fetchCompendiumMonsters()

      expect(useGameStore.getState().compendiumMonsters).toHaveLength(1)
    })
  })

  describe('fetchCompendiumMonsterDrops', () => {
    it('should fetch monster drops', async () => {
      const { apiGet } = await import('@/lib/api')
      vi.mocked(apiGet).mockResolvedValueOnce({
        monster: { id: 1, name: 'Monster1' },
        drop_table: {},
        drop_rates: { item: 0.1, gold: 0.5 },
        possible_items: [],
      })

      await useGameStore.getState().fetchCompendiumMonsterDrops(1)

      expect(useGameStore.getState().compendiumMonsterDrops).toBeDefined()
    })
  })

  describe('clearCompendiumMonsterDrops', () => {
    it('should clear monster drops', () => {
      useGameStore.setState({
        compendiumMonsterDrops: {
          monster: {} as any,
          drop_table: {},
          drop_rates: {} as any,
          possible_items: [],
        },
      })
      useGameStore.getState().clearCompendiumMonsterDrops()
      expect(useGameStore.getState().compendiumMonsterDrops).toBeNull()
    })
  })

  describe('revive', () => {
    it('should revive character', async () => {
      const { post } = await import('@/lib/api')
      vi.mocked(post).mockResolvedValueOnce({})

      useGameStore.setState({
        selectedCharacterId: 1,
        isFighting: true,
        combatResult: { victory: false } as any,
      })

      await useGameStore.getState().revive()

      expect(post).toHaveBeenCalledWith('/rpg/combat/revive', { character_id: 1 })
      expect(useGameStore.getState().isFighting).toBe(false)
      expect(useGameStore.getState().shouldAutoCombat).toBe(false)
    })

    it('should restore enabled active skills after revive when cleared', async () => {
      const { post } = await import('@/lib/api')
      vi.mocked(post).mockResolvedValueOnce({})

      useGameStore.setState({
        selectedCharacterId: 1,
        enabledSkillIds: [],
        skills: [
          { id: 1, is_learned: true, type: 'active' },
          { id: 2, is_learned: true, type: 'passive' },
          { id: 3, is_learned: false, type: 'active' },
        ] as any,
      })

      await useGameStore.getState().revive()

      expect(useGameStore.getState().enabledSkillIds).toEqual([1])
    })
  })

  describe('setCharacter', () => {
    it('should update character using updater function', () => {
      useGameStore.setState({
        character: { id: 1, name: 'Old', level: 1 } as GameCharacter,
      })

      useGameStore.getState().setCharacter(prev => (prev ? { ...prev, name: 'New' } : null))

      expect(useGameStore.getState().character?.name).toBe('New')
    })
  })
})
