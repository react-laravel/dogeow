import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Dice } from '../components/Dice'

describe('Dice', () => {
  it('renders svg dice with accessible value', () => {
    render(<Dice value={4} />)

    expect(screen.getByRole('img', { name: '骰子 4 点' })).toBeInTheDocument()
    expect(screen.getByTestId('monopoly-dice')).toBeInTheDocument()
  })

  it('adds rolling animation class while rolling', () => {
    render(<Dice value={6} rolling />)

    const dice = screen.getByTestId('monopoly-dice')
    expect(dice).toHaveClass('monopoly-dice-roll')
    expect(dice.getAttribute('class')).not.toContain('0_8px_8px')
  })
})
