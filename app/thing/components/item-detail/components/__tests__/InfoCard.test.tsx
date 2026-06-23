import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InfoCard } from '../InfoCard'

describe('InfoCard', () => {
  it('renders label and value', () => {
    render(<InfoCard label="Price" value="¥100" />)
    expect(screen.getByText('Price')).toBeDefined()
    expect(screen.getByText('¥100')).toBeDefined()
  })

  it('renders numeric value', () => {
    render(<InfoCard label="Count" value={5} />)
    expect(screen.getByText('5')).toBeDefined()
  })

  it('applies custom className', () => {
    const { container } = render(<InfoCard label="Test" value="val" className="extra-class" />)
    expect(container.firstChild?.className).toContain('extra-class')
  })
})
