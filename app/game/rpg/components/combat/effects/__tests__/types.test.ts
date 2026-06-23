import { describe, expect, it } from 'vitest'
import type { SkillEffectType, SkillEffectProps, EffectBaseProps } from '../effects/types'

describe('combat effects types', () => {
  it('should have all valid SkillEffectType values', () => {
    const types: SkillEffectType[] = [
      'meteor-storm',
      'fireball',
      'ice-arrow',
      'ice-age',
      'blackhole',
      'heal',
      'lightning',
      'meteor',
      'chain-lightning',
    ]
    types.forEach(type => {
      const effectType: SkillEffectType = type
      expect(effectType).toBe(type)
    })
  })

  it('should allow SkillEffectProps', () => {
    const props: SkillEffectProps = {
      type: 'fireball',
      active: true,
      duration: 1000,
      targetPosition: { x: 0.5, y: 0.5 },
      targetPositions: [
        { x: 0.3, y: 0.3 },
        { x: 0.7, y: 0.7 },
      ],
      onComplete: () => {},
      onHit: () => {},
      className: 'custom-class',
    }
    expect(props.type).toBe('fireball')
    expect(props.active).toBe(true)
    expect(props.duration).toBe(1000)
    expect(props.targetPosition).toEqual({ x: 0.5, y: 0.5 })
    expect(props.targetPositions).toHaveLength(2)
  })

  it('should allow SkillEffectProps with minimal fields', () => {
    const props: SkillEffectProps = {
      type: 'lightning',
      active: false,
    }
    expect(props.duration).toBeUndefined()
    expect(props.targetPosition).toBeUndefined()
    expect(props.onComplete).toBeUndefined()
  })

  it('should allow EffectBaseProps', () => {
    const props: EffectBaseProps = {
      active: true,
      onComplete: () => {},
      onHit: () => {},
      targetPosition: { x: 0.5, y: 0.5 },
      targetPositions: [{ x: 0.5, y: 0.5 }],
    }
    expect(props.active).toBe(true)
  })

  it('should allow EffectBaseProps with minimal fields', () => {
    const props: EffectBaseProps = {
      active: false,
    }
    expect(props.onComplete).toBeUndefined()
    expect(props.onHit).toBeUndefined()
  })

  it('should allow targetPosition coordinates between 0 and 1', () => {
    const props: SkillEffectProps = {
      type: 'ice-arrow',
      active: true,
      targetPosition: { x: 0.25, y: 0.75 },
    }
    expect(props.targetPosition!.x).toBe(0.25)
    expect(props.targetPosition!.y).toBe(0.75)
  })

  it('should allow multiple targetPositions', () => {
    const positions = [
      { x: 0.2, y: 0.3 },
      { x: 0.5, y: 0.5 },
      { x: 0.8, y: 0.7 },
    ]
    const props: SkillEffectProps = {
      type: 'chain-lightning',
      active: true,
      targetPositions: positions,
    }
    expect(props.targetPositions).toHaveLength(3)
  })
})
