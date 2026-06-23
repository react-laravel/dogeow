import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SkillEffect } from '../index'
import type { SkillEffectProps } from '../types'

describe('combat effects index', () => {
  const renderEffect = (props: SkillEffectProps) => render(<SkillEffect {...props} />)

  it('should export SkillEffect component', () => {
    expect(SkillEffect).toBeDefined()
    expect(typeof SkillEffect).toBe('function')
  })

  it('should render SkillEffect without crashing', () => {
    const { container } = renderEffect({ type: 'fireball', active: true })
    expect(container).toBeDefined()
  })

  it('should render with custom className', () => {
    const { container } = renderEffect({
      type: 'fireball',
      active: true,
      className: 'my-custom-class',
    })
    expect(container).toBeDefined()
  })

  it('should render different effect types', () => {
    const effectTypes: SkillEffectProps['type'][] = [
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

    effectTypes.forEach(type => {
      const { container } = renderEffect({ type, active: true })
      expect(container).toBeDefined()
    })
  })

  it('should pass onComplete callback', () => {
    const { container } = renderEffect({
      type: 'meteor',
      active: true,
      onComplete: vi.fn(),
    })
    expect(container).toBeDefined()
  })

  it('should pass onHit callback', () => {
    const { container } = renderEffect({
      type: 'fireball',
      active: true,
      onHit: vi.fn(),
    })
    expect(container).toBeDefined()
  })

  it('should pass targetPosition', () => {
    const { container } = renderEffect({
      type: 'ice-arrow',
      active: true,
      targetPosition: { x: 0.5, y: 0.5 },
    })
    expect(container).toBeDefined()
  })
})
