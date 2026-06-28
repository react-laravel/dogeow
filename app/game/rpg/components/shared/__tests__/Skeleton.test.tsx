import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Skeleton,
  SkeletonLine,
  CharacterPanelSkeleton,
  InventoryPanelSkeleton,
  SkillPanelSkeleton,
  CombatPanelSkeleton,
  CompendiumPanelSkeleton,
} from '../Skeleton'

describe('Skeleton', () => {
  it('should render without crashing', () => {
    const { container } = render(<Skeleton className="w-10 h-10" />)
    expect(container.firstChild).toBeDefined()
  })

  it('should render with default className', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toBeDefined()
  })

  it('should render with style prop', () => {
    const { container } = render(<Skeleton style={{ width: '100px' }} />)
    expect(container.firstChild).toBeDefined()
  })
})

describe('SkeletonLine', () => {
  it('should render without crashing', () => {
    const { container } = render(<SkeletonLine width="50%" />)
    expect(container.firstChild).toBeDefined()
  })

  it('should render with default width', () => {
    const { container } = render(<SkeletonLine />)
    expect(container.firstChild).toBeDefined()
  })
})

describe('CharacterPanelSkeleton', () => {
  it('should render without crashing', () => {
    const { container } = render(<CharacterPanelSkeleton />)
    expect(container.firstChild).toBeDefined()
  })
})

describe('InventoryPanelSkeleton', () => {
  it('should render without crashing', () => {
    const { container } = render(<InventoryPanelSkeleton />)
    expect(container.firstChild).toBeDefined()
  })
})

describe('SkillPanelSkeleton', () => {
  it('should render without crashing', () => {
    const { container } = render(<SkillPanelSkeleton />)
    expect(container.firstChild).toBeDefined()
  })
})

describe('CombatPanelSkeleton', () => {
  it('should render without crashing', () => {
    const { container } = render(<CombatPanelSkeleton />)
    expect(container.firstChild).toBeDefined()
  })
})

describe('CompendiumPanelSkeleton', () => {
  it('should render without crashing', () => {
    const { container } = render(<CompendiumPanelSkeleton />)
    expect(container.firstChild).toBeDefined()
  })
})
