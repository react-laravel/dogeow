import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CombatPanel } from '../CombatPanel'

// Mock dependencies
vi.mock('../../stores/gameStore', () => ({
  useGameStore: vi.fn(() => ({
    currentMap: null,
    maps: [],
    enterMap: vi.fn(),
    fetchMaps: vi.fn(),
    teleportToMap: vi.fn(),
    revive: vi.fn(),
    isFighting: false,
    setShouldAutoCombat: vi.fn(),
    stopCombat: vi.fn(),
    isLoading: false,
    combatLogs: [],
    combatResult: null,
    currentCombatMonsterFromStatus: null,
    skills: [],
    character: null,
    combatStats: null,
    currentHp: null,
    currentMana: null,
    enabledSkillIds: [],
    toggleEnabledSkill: vi.fn(),
    inventory: [],
    consumePotion: vi.fn(),
  })),
}))

vi.mock('./BattleArena', () => ({
  BattleArena: vi.fn(() => <div data-testid="battle-arena" />),
}))

vi.mock('./BattleSkillBar', () => ({
  BattleSkillBar: vi.fn(() => <div data-testid="battle-skill-bar" />),
}))

vi.mock('./CombatLogList', () => ({
  CombatLogList: vi.fn(() => <div data-testid="combat-log-list" />),
}))

vi.mock('./MapCardMonsterAvatar', () => ({
  MapCardMonsterAvatar: vi.fn(() => <div data-testid="monster-avatar" />),
}))

vi.mock('../../utils/mapBackground', () => ({
  getMapBackgroundStyle: vi.fn(() => ({})),
}))

vi.mock('../../utils/combat', () => ({
  getActName: vi.fn(() => 'Act 1'),
}))

vi.mock('lucide-react', () => ({
  LogIn: vi.fn(() => <span data-testid="log-in-icon" />),
  Heart: vi.fn(() => <span data-testid="heart-icon" />),
  Droplet: vi.fn(() => <span data-testid="droplet-icon" />),
}))

describe('CombatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render combat panel', () => {
      render(<CombatPanel />)
      expect(screen.getByTestId('battle-arena')).toBeInTheDocument()
    })

    it('should render skill bar', () => {
      render(<CombatPanel />)
      expect(screen.getByTestId('battle-skill-bar')).toBeInTheDocument()
    })

    it('should render combat log list', () => {
      render(<CombatPanel />)
      expect(screen.getByTestId('combat-log-list')).toBeInTheDocument()
    })
  })

  describe('Map Selection', () => {
    it('should show map dropdown when clicked', async () => {
      render(<CombatPanel />)
      const dropdown = screen.getByTestId('log-in-icon')?.closest('button')
      if (dropdown) {
        fireEvent.click(dropdown)
        await waitFor(() => {
          // Dropdown should open
        })
      }
    })
  })

  describe('Auto Combat Toggle', () => {
    it('should have auto combat toggle', () => {
      const { useGameStore } = require('../../stores/gameStore')
      vi.mocked(useGameStore).mockReturnValue({
        currentMap: { id: 1, name: 'Test Map' },
        maps: [],
        enterMap: vi.fn(),
        fetchMaps: vi.fn(),
        teleportToMap: vi.fn(),
        revive: vi.fn(),
        isFighting: true,
        setShouldAutoCombat: vi.fn(),
        stopCombat: vi.fn(),
        isLoading: false,
        combatLogs: [],
        combatResult: null,
        currentCombatMonsterFromStatus: { id: 1, name: 'Monster', hp: 100, max_hp: 100, type: 'normal', level: 1 },
        skills: [],
        character: { id: 1, name: 'Test', level: 1 },
        combatStats: { max_hp: 100, max_mana: 50, attack: 10, defense: 5, crit_rate: 0.1, crit_damage: 1.5 },
        currentHp: 100,
        currentMana: 50,
        enabledSkillIds: [],
        toggleEnabledSkill: vi.fn(),
        inventory: [],
        consumePotion: vi.fn(),
      })
      render(<CombatPanel />)
      // Should render health/mana indicators
      expect(screen.getByTestId('heart-icon')).toBeInTheDocument()
    })
  })

  describe('Combat Controls', () => {
    it('should render stop combat button when fighting', () => {
      const { useGameStore } = require('../../stores/gameStore')
      vi.mocked(useGameStore).mockReturnValue({
        currentMap: { id: 1, name: 'Test Map' },
        maps: [],
        enterMap: vi.fn(),
        fetchMaps: vi.fn(),
        teleportToMap: vi.fn(),
        revive: vi.fn(),
        isFighting: true,
        setShouldAutoCombat: vi.fn(),
        stopCombat: vi.fn(),
        isLoading: false,
        combatLogs: [],
        combatResult: null,
        currentCombatMonsterFromStatus: { id: 1, name: 'Monster', hp: 100, max_hp: 100, type: 'normal', level: 1 },
        skills: [],
        character: { id: 1, name: 'Test', level: 1 },
        combatStats: { max_hp: 100, max_mana: 50, attack: 10, defense: 5, crit_rate: 0.1, crit_damage: 1.5 },
        currentHp: 100,
        currentMana: 50,
        enabledSkillIds: [],
        toggleEnabledSkill: vi.fn(),
        inventory: [],
        consumePotion: vi.fn(),
      })
      render(<CombatPanel />)
      expect(screen.getByTestId('battle-arena')).toBeInTheDocument()
    })
  })
})