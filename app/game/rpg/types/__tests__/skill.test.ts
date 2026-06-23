import { describe, expect, it } from 'vitest'
import type {
  SkillDefinition,
  SkillWithLearnedState,
  CharacterSkill,
  SkillType,
  SkillTargetType,
} from '../skill'

describe('skill types', () => {
  it('should allow SkillType values', () => {
    const types: SkillType[] = ['active', 'passive']
    types.forEach(type => {
      expect(type).toBeDefined()
    })
  })

  it('should allow SkillTargetType values', () => {
    const types: SkillTargetType[] = ['single', 'all']
    types.forEach(type => {
      expect(type).toBeDefined()
    })
  })

  it('should allow SkillDefinition with all fields', () => {
    const skill: SkillDefinition = {
      id: 1,
      name: 'Fireball',
      description: 'Throws a fireball',
      type: 'active',
      class_restriction: 'mage',
      branch: 'fire',
      tier: 2,
      skill_stage: 'core',
      skill_line: 'fire_mastery',
      node_tier: 1,
      spec_branch: 'a',
      unlock_level: 5,
      prerequisite_skill_id: 2,
      prerequisite_effect_key: 'fire_bolt',
      effect_key: 'fireball',
      max_level: 5,
      base_damage: 50,
      damage_per_level: 10,
      mana_cost: 20,
      mana_cost_per_level: 5,
      cooldown: 3,
      icon: 'fireball.png',
      effects: { burn: { damage: 10 } },
      target_type: 'single',
      skill_points_cost: 1,
    }
    expect(skill.effect_key).toBe('fireball')
    expect(skill.max_level).toBe(5)
  })

  it('should allow SkillDefinition with minimal fields', () => {
    const skill: SkillDefinition = {
      id: 1,
      name: 'Basic Attack',
      type: 'active',
      class_restriction: 'all',
      max_level: 1,
      base_damage: 10,
      damage_per_level: 0,
      mana_cost: 0,
      mana_cost_per_level: 0,
      cooldown: 0,
    }
    expect(skill.description).toBeUndefined()
    expect(skill.effect_key).toBeUndefined()
  })

  it('should allow SkillDefinition for all class restrictions', () => {
    const classes = ['warrior', 'mage', 'ranger', 'all'] as const
    classes.forEach(cls => {
      const skill: SkillDefinition = {
        id: 1,
        name: 'Test',
        type: 'active',
        class_restriction: cls,
        max_level: 1,
        base_damage: 10,
        damage_per_level: 0,
        mana_cost: 0,
        mana_cost_per_level: 0,
        cooldown: 0,
      }
      expect(skill.class_restriction).toBe(cls)
    })
  })

  it('should allow SkillDefinition with all skill stages', () => {
    const stages = ['basic', 'core', 'defensive', 'special', 'ultimate', 'key_passive'] as const
    stages.forEach(stage => {
      const skill: SkillDefinition = {
        id: 1,
        name: 'Test',
        type: 'active',
        class_restriction: 'all',
        max_level: 1,
        base_damage: 10,
        damage_per_level: 0,
        mana_cost: 0,
        mana_cost_per_level: 0,
        cooldown: 0,
        skill_stage: stage,
      }
      expect(skill.skill_stage).toBe(stage)
    })
  })

  it('should allow SkillWithLearnedState', () => {
    const skill: SkillWithLearnedState = {
      id: 1,
      name: 'Fireball',
      type: 'active',
      class_restriction: 'mage',
      max_level: 5,
      base_damage: 50,
      damage_per_level: 10,
      mana_cost: 20,
      mana_cost_per_level: 5,
      cooldown: 3,
      is_learned: true,
      character_skill_id: 10,
      level: 3,
      slot_index: 0,
    }
    expect(skill.is_learned).toBe(true)
    expect(skill.level).toBe(3)
    expect(skill.slot_index).toBe(0)
  })

  it('should allow SkillWithLearnedState without optional fields', () => {
    const skill: SkillWithLearnedState = {
      id: 1,
      name: 'Basic',
      type: 'passive',
      class_restriction: 'all',
      max_level: 1,
      base_damage: 0,
      damage_per_level: 0,
      mana_cost: 0,
      mana_cost_per_level: 0,
      cooldown: 0,
      is_learned: false,
    }
    expect(skill.character_skill_id).toBeUndefined()
    expect(skill.level).toBeUndefined()
    expect(skill.slot_index).toBeUndefined()
  })

  it('should allow SkillWithLearnedState with null slot_index', () => {
    const skill: SkillWithLearnedState = {
      id: 1,
      name: 'Test',
      type: 'active',
      class_restriction: 'all',
      max_level: 1,
      base_damage: 10,
      damage_per_level: 0,
      mana_cost: 0,
      mana_cost_per_level: 0,
      cooldown: 0,
      is_learned: true,
      slot_index: null,
    }
    expect(skill.slot_index).toBeNull()
  })

  it('should allow CharacterSkill', () => {
    const charSkill: CharacterSkill = {
      id: 1,
      character_id: 1,
      skill_id: 1,
      skill: {
        id: 1,
        name: 'Fireball',
        type: 'active',
        class_restriction: 'mage',
        max_level: 5,
        base_damage: 50,
        damage_per_level: 10,
        mana_cost: 20,
        mana_cost_per_level: 5,
        cooldown: 3,
      },
      level: 2,
      slot_index: 0,
    }
    expect(charSkill.level).toBe(2)
    expect(charSkill.skill.name).toBe('Fireball')
  })

  it('should allow CharacterSkill with null slot_index', () => {
    const charSkill: CharacterSkill = {
      id: 1,
      character_id: 1,
      skill_id: 1,
      skill: {
        id: 1,
        name: 'Test',
        type: 'passive',
        class_restriction: 'all',
        max_level: 1,
        base_damage: 0,
        damage_per_level: 0,
        mana_cost: 0,
        mana_cost_per_level: 0,
        cooldown: 0,
      },
      level: 1,
      slot_index: null,
    }
    expect(charSkill.slot_index).toBeNull()
  })
})
