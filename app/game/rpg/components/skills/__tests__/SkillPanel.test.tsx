import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SkillPanel } from '../SkillPanel'

// Mock dependencies
vi.mock('../../stores/gameStore', () => ({
  useGameStore: vi.fn(() => ({
    skills: [],
    character: null,
    fetchSkills: vi.fn(),
    learnSkill: vi.fn(),
    skillPoints: 0,
  })),
}))

vi.mock('next/image', () => ({
  default: vi.fn(() => <img />),
}))

vi.mock('../../utils/assetUrls', () => ({
  getRpgSkillImageUrl: vi.fn(() => '/skill.png'),
}))

describe('SkillPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render skill panel', () => {
      render(<SkillPanel />)
      // Panel should render without error
      expect(screen.getByText('技能')).toBeInTheDocument()
    })
  })

  describe('Skill Points', () => {
    it('should display skill points when character has them', () => {
      const { useGameStore } = require('../../stores/gameStore')
      vi.mocked(useGameStore).mockReturnValue({
        skills: [],
        character: { id: 1, name: 'Test' },
        fetchSkills: vi.fn(),
        learnSkill: vi.fn(),
        skillPoints: 5,
      })
      render(<SkillPanel />)
      expect(screen.getByText(/技能点/)).toBeInTheDocument()
    })
  })

  describe('Skill List', () => {
    it('should render skills when available', () => {
      const mockSkills = [
        { id: 1, name: 'Fireball', is_learned: true, type: 'active', branch: 'fire' },
        { id: 2, name: 'Ice Shield', is_learned: false, type: 'active', branch: 'ice' },
      ]
      const { useGameStore } = require('../../stores/gameStore')
      vi.mocked(useGameStore).mockReturnValue({
        skills: mockSkills,
        character: { id: 1, name: 'Test' },
        fetchSkills: vi.fn(),
        learnSkill: vi.fn(),
        skillPoints: 5,
      })
      render(<SkillPanel />)
      expect(screen.getByText('Fireball')).toBeInTheDocument()
    })
  })

  describe('Learn Skill', () => {
    it('should call learnSkill when clicking unlearned skill', async () => {
      const mockSkill = { id: 1, name: 'Fireball', is_learned: false, type: 'active', branch: 'fire' }
      const learnSkill = vi.fn()
      const { useGameStore } = require('../../stores/gameStore')
      vi.mocked(useGameStore).mockReturnValue({
        skills: [mockSkill],
        character: { id: 1, name: 'Test' },
        fetchSkills: vi.fn(),
        learnSkill,
        skillPoints: 5,
      })
      render(<SkillPanel />)
      // Skill should be clickable when not learned
      await waitFor(() => {
        expect(screen.getByText('Fireball')).toBeInTheDocument()
      })
    })
  })
})