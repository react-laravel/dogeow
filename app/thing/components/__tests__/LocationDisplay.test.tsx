import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LocationDisplay } from '../LocationDisplay'

describe('LocationDisplay', () => {
  it('returns null when spot is undefined', () => {
    const { container } = render(<LocationDisplay />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null when spot is null', () => {
    const { container } = render(<LocationDisplay spot={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null when no location path parts', () => {
    const { container } = render(<LocationDisplay spot={{ name: '', room: null } as any} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders full location path', () => {
    const spot = {
      name: 'Spot A',
      room: { name: 'Room A', area: { name: 'Area A' } },
    }
    render(<LocationDisplay spot={spot} />)
    expect(screen.getByText('Area A > Room A > Spot A')).toBeDefined()
  })

  it('renders partial path with only area and room', () => {
    const spot = {
      name: '',
      room: { name: 'Room A', area: { name: 'Area A' } },
    }
    render(<LocationDisplay spot={spot} />)
    expect(screen.getByText('Area A > Room A')).toBeDefined()
  })

  it('renders partial path with only area', () => {
    const spot = {
      name: '',
      room: { name: '', area: { name: 'Area A' } },
    }
    render(<LocationDisplay spot={spot} />)
    expect(screen.getByText('Area A')).toBeDefined()
  })
})
