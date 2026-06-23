import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../../stores/gameStore'
import { RpgStatusHeader } from '../RpgStatusHeader'

describe('RpgStatusHeader', () => {
  beforeEach(() => {
    useGameStore.setState({
      character: null,
      combatStats: null,
      currentHp: null,
      currentMana: null,
      experienceTable: {},
    })
  })

  it('should render without crashing when character data is present', () => {
    useGameStore.setState({
      character: {
        id: 1,
        name: 'Hero',
        level: 2,
        experience: 100,
        copper: 123,
      } as any,
      combatStats: {
        max_hp: 100,
        max_mana: 50,
      } as any,
      currentHp: 80,
      currentMana: 30,
      experienceTable: { 3: 1000 },
    })

    render(<RpgStatusHeader />)

    expect(screen.getByText('Lv.2')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('should return null when character is null', () => {
    const { container } = render(<RpgStatusHeader />)
    expect(container.firstChild).toBeNull()
  })
})
