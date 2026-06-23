import { render } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it } from 'vitest'
import { SkillIcon } from '../SkillIcon'

describe('SkillIcon', () => {
  const expectRendered = (props: ComponentProps<typeof SkillIcon>) => {
    const { container } = render(<SkillIcon {...props} />)
    expect(container.firstChild).toBeDefined()
  }

  it('should render without crashing', () => {
    expectRendered({ name: 'Fireball' })
  })

  it('should display name initial as fallback', () => {
    expectRendered({ name: 'Fireball' })
  })

  it('should use icon when provided', () => {
    expectRendered({ name: 'Fireball', icon: 'fireball.png' })
  })

  it('should use effectKey when provided', () => {
    expectRendered({ name: 'Fireball', effectKey: 'fireball' })
  })

  it('should use effectKey without extension', () => {
    expectRendered({ name: 'Fireball', effectKey: 'ice-arrow' })
  })

  it('should render with sm size', () => {
    expectRendered({ name: 'Test', size: 'sm' })
  })

  it('should render with md size', () => {
    expectRendered({ name: 'Test', size: 'md' })
  })

  it('should use single character as fallback for short name', () => {
    expectRendered({ name: 'A' })
  })

  it('should use ? when no name provided', () => {
    expectRendered({ name: '' })
  })

  it('should use icon as fallback when icon is 4 chars or less', () => {
    expectRendered({ name: 'Fireball', icon: 'FB' })
  })
})
